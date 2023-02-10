import { initTRPC } from "@trpc/server";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { z } from "zod";
import { CONFIG } from "./config";
import Stripe from "stripe";
import fastify from "fastify";
import { fastifyCors } from "@fastify/cors";

const app = fastify();

const stripe = new Stripe(CONFIG.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

const t = initTRPC.create();
const router = t.router;
const publicProcedure = t.procedure;

const appRouter = router({
  getStripeUserInfo: publicProcedure
    .input(
      z.object({
        stripeCustomerId: z
          .string()
          .describe("Customer ID from Stripe (sub_...)"),
      })
    )
    .query(async (req) => {
      const { stripeCustomerId } = req.input;

      const customer = await stripe.customers.retrieve(stripeCustomerId);

      console.log(customer);

      if (customer.deleted) return null;

      return { name: customer.name, address: customer.address };
    }),

  updateDefaultPaymentMethod: publicProcedure
    .input(
      z.object({
        stripeCustomerId: z
          .string()
          .describe("Customer ID from Stripe (sub_...)"),
        stripePaymentMethodId: z
          .string()
          .describe("PaymentMethod ID from Stripe (pm_...)"),
      })
    )
    .mutation(async ({ input }) => {
      const { stripeCustomerId, stripePaymentMethodId } = input;

      const paymentMethod = await stripe.paymentMethods.attach(
        stripePaymentMethodId,
        { customer: stripeCustomerId }
      );

      const customer = await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethod.id,
        },
      });

      return {
        customer: customer.id,
      };
    }),
});

export type AppRouter = typeof appRouter;

app.register(fastifyCors);

app.register(fastifyTRPCPlugin, {
  prefix: "/trpc",
  trpcOptions: { router: appRouter },
});

async function run() {
  await app.listen({
    port: 4545,
  });
  console.log(`Listening on http://localhost:4545 🛸`);
}

run();
