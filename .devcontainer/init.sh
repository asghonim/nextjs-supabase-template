npx playwright install --with-deps && npm install -g @playwright/cli;
playwright-cli install-browser chromium
npm install
npx --yes shadcn@latest add --all --yes --overwrite
[ -f "$BROWSER" ] && ! command -v xdg-open > /dev/null && sudo ln -s "$BROWSER" /usr/local/bin/xdg-open