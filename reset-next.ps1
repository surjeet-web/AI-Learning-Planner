Write-Host "Cleaning Next.js cache and node_modules..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force pnpm-lock.yaml -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

Write-Host "Reinstalling dependencies..." -ForegroundColor Green
npm install

Write-Host "Rebuilding Next.js..." -ForegroundColor Blue
npm run build

Write-Host "Starting development server..." -ForegroundColor Magenta
npm run dev