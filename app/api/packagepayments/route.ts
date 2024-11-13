import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '../../../lib/db';
import { orderHistory, enterprises } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-09-30.acacia',
});

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const { packageId,amount,organizationId } = body;

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Package Purchase`,
            },
            unit_amount: amount * 100, // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/enterprise/paymentDone?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/enterprise/PaymentCancel`,
    });

    await db.insert(orderHistory).values({
        enterprise_id: organizationId,
        package_id: packageId,
        amount: amount,
        status: 'Pending',
        payment_info: session.id,
        description: `Package Purchase`,
        createdAt: new Date(),

    });



    // Return the session ID to the client
    return NextResponse.json({ id: session.id }, { status: 200 });
  } catch (err: any) {
    // Return error message if something goes wrong
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}



export async function GET(req: NextRequest) {

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('session_id');
  if (!sessionId) {
    return NextResponse.json({ message: "Session ID is required" }, { status: 400 });
  }
  try {
    // Retrieve the session from Stripe

    const session = await stripe.checkout.sessions.retrieve(sessionId as string);

   
    // Update payment status in your database based on session status
    if (session.payment_status === 'paid') {
      const updatedepayment = await db.update(orderHistory)
        .set({ status: 'paid' })
        .where(eq(orderHistory.payment_info, sessionId)).returning({ package_id: orderHistory.package_id, enterprise_id:orderHistory.enterprise_id });;

      const updateevaluation = await db.update(enterprises)
        .set({ package_id:updatedepayment[0].package_id})
        .where(eq(enterprises.id, updatedepayment[0].enterprise_id)).returning();

      return NextResponse.json(session);
    }

    // Return the session information

  } catch (error) {
    return NextResponse.json({ message: "Unable to retrieve data" }, { status: 500 });
  }
}
