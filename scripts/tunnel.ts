import { config } from 'dotenv';
config();
import { fetch } from 'undici';
import { spawn } from 'child_process';
import ngrok from '@ngrok/ngrok';

const PORT = parseInt(process.env.PORT || '3000', 10);
const NGROK_API_URL = 'http://127.0.0.1:4040/api/tunnels';

function printBanner(url: string) {
  console.log('\n======================================================');
  console.log('                 MANDATE TUNNEL UP                    ');
  console.log('======================================================');
  console.log(`Public URL:     ${url}`);
  console.log(`Paste to .env:  APP_URL=${url}`);
  console.log(`Return URL:     ${url}/paypal/return`);
  console.log(`Webhook URL:    ${url}/api/webhooks/paypal`);
  console.log('======================================================\n');
}

async function pollLocalNgrokApi(maxAttempts = 30): Promise<string | null> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(NGROK_API_URL, { signal: AbortSignal.timeout(1000) });
      if (res.ok) {
        const data = (await res.json()) as any;
        const httpsTunnel = data.tunnels?.find((t: any) => t.proto === 'https');
        if (httpsTunnel && httpsTunnel.public_url) {
          return httpsTunnel.public_url;
        }
      }
    } catch {
      // ngrok not up yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return null;
}

async function main() {
  console.log(`Starting tunnel for local port ${PORT}...`);

  // 1. Check if an external ngrok is already running on port 4040
  let publicUrl = await pollLocalNgrokApi(2);

  if (publicUrl) {
    printBanner(publicUrl);
  } else {
    // 2. Try starting with @ngrok/ngrok
    try {
      const authtoken = process.env.NGROK_AUTHTOKEN;
      const listener = await ngrok.forward({
        addr: PORT,
        authtoken,
      });

      publicUrl = listener.url() || '';
      if (publicUrl) {
        printBanner(publicUrl);
      }
    } catch (err: any) {
      console.warn('Could not launch @ngrok/ngrok directly:', err?.message || err);
      console.log('Attempting system ngrok process...');

      const proc = spawn('npx', ['ngrok', 'http', String(PORT)], {
        stdio: 'inherit',
      });

      proc.on('error', (spawnErr) => {
        console.error('Failed to spawn ngrok:', spawnErr.message);
        console.log('\nMANUAL ACTION REQUIRED:');
        console.log('1. Install ngrok: brew install ngrok');
        console.log('2. Authenticate: ngrok config add-authtoken <token>');
        console.log(`3. Run: ngrok http ${PORT}\n`);
      });

      publicUrl = await pollLocalNgrokApi(30);
      if (publicUrl) {
        printBanner(publicUrl);
      }
    }
  }

  if (!publicUrl) {
    console.error('Could not detect active tunnel URL.');
    console.log('If you are running ngrok manually or deploying to a public host, set APP_URL in .env.');
    return;
  }

  // Keep alive & monitor for rotation
  let currentUrl = publicUrl;
  setInterval(async () => {
    try {
      const latestUrl = await pollLocalNgrokApi(2);
      if (latestUrl && latestUrl !== currentUrl) {
        currentUrl = latestUrl;
        console.log('\n[ALERT] URL ROTATED:');
        printBanner(latestUrl);
      }
    } catch {
      // ignore transient poll errors
    }
  }, 10000);
}

main().catch((err) => {
  console.error('Tunnel error:', err);
  process.exit(1);
});
