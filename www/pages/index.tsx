import { Elements, CardElement, AddressElement } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe("pk_live_4bQ1e2d5RKyIon51HcMcwf8S");

function UpdateBillingForm() {
  return (
    <form>
      <CardElement />
      <AddressElement
        options={{
          mode: "billing",
        }}
      />
      <button>Update my Billing</button>
    </form>
  );
}

export default function App() {
  return (
    <Elements stripe={stripePromise}>
      <div style={{ marginLeft: "calc(50vw - 250px)", marginTop: 200 }}>
        <div>
          <UpdateBillingForm />
        </div>
      </div>
    </Elements>
  );
}
