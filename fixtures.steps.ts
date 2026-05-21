import { test as base, createBdd } from 'playwright-bdd';
import { SupabaseMock } from '@asghonim/playwright-supabase';

type Fixtures = {
  supabaseMock: SupabaseMock;
};

export const test = base.extend<Fixtures>({
  supabaseMock: async ({ page }, use) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(new SupabaseMock(page, { url: process.env.NEXT_PUBLIC_SUPABASE_URL! }));
  },
});

export const { Given, When, Then, Before } = createBdd(test);