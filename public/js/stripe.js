/*eslint-disable*/
import axios from "axios";
import { showAlert } from "./alerts";

const stripe = Stripe(
    "pk_test_51Guz3NGFH5AGiIil6aY1tHrtIj05aYvTNxFNkiMwI3bSBt7tjxZGIaHKEtPrK4eKkW7jdQ3C7Xl35W9mvpJ6eIAG006LJHzQMB"
);

export const bookTour = async tourId => {
    try {
        //1. Get checkout session fro API
        const session = await axios(
            ` http://127.0.0.1:8000/api/v1/bookings/checkout-session/${tourId}`
        );
        console.log(session);
        //2. Create checkout form + charge credit card for us
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        });
    } catch (err) {
        console.log(err);
        showAlert("error", err);
    }
};
