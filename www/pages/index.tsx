import {
  Elements,
  CardElement,
  AddressElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import queryString from "query-string";
import { FormEvent, useEffect, useState } from "react";
import { RouterOutput, trpc } from "../trpc";
import { toast } from "react-toastify";

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe("pk_live_4bQ1e2d5RKyIon51HcMcwf8S");

interface UpdateBillingFormProps {
  name?: NonNullable<IUser>["name"];
  navigateToThankYou: () => void;
}

function UpdateBillingForm(props: UpdateBillingFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = queryString.parse(location.search) as {
      customerId?: string;
    };

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable
      // form submission until Stripe.js has loaded.
      return;
    }

    const cardElement = elements.getElement(CardElement);
    const addressElement = elements.getElement(AddressElement);

    if (!cardElement || !addressElement || !parsed.customerId) return;

    const billingDetails = await (addressElement as any).getValue();

    const payload = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
      billing_details: {
        ...billingDetails.value,
      },
    });

    if (!payload.paymentMethod) return;

    await trpc.updateDefaultPaymentMethod.mutate({
      stripeCustomerId: parsed.customerId,
      stripePaymentMethodId: payload.paymentMethod.id,
    });

    // Popup saying all is good and go to "Thanks!"

    toast("Billing successfully updated", {
      type: "success",
    });

    props.navigateToThankYou();

    console.log("Done!");
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <AddressElement
        options={{
          mode: "billing",
          fields: {
            phone: "always",
          },
          validation: {
            phone: {
              required: "always",
            },
          },
          defaultValues: {
            name: props.name,
          },
        }}
      />
      <button>Update my Billing</button>
    </form>
  );
}

type IUser = RouterOutput["getStripeUserInfo"];

export default function App() {
  const [user, setUser] = useState<IUser>(null);
  const [goToThankYou, setGoToThankYou] = useState(false);

  useEffect(() => {
    const parsed = queryString.parse(location.search) as {
      customerId?: string;
    };

    (async () => {
      if (!parsed.customerId) return;

      try {
        const user = await trpc.getStripeUserInfo.query({
          stripeCustomerId: parsed.customerId,
        });

        if (!user) {
          toast("Billing not found, please reach out to help@learnistic.com", {
            type: "error",
            autoClose: false,
          });

          return;
        }

        setUser(user);
      } catch (err) {
        toast("Billing not found. Please reach out to help@learnistic.com", {
          type: "error",
          autoClose: false,
        });
      }
    })();
  }, []);

  if (!user) return;

  function navigateToThankYou() {
    setGoToThankYou(true);
  }

  console.log(user);

  if (goToThankYou) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        <h1>Thanks!</h1>
        <h3 style={{ marginTop: 0 }}>
          Your billing information is now up to date.
        </h3>{" "}
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <div style={{ marginLeft: "calc(50vw - 250px)", marginTop: 200 }}>
        <div>
          <UpdateBillingForm
            name={user.name}
            navigateToThankYou={navigateToThankYou}
          />
        </div>
      </div>
    </Elements>
  );
}
