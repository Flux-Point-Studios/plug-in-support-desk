# Stripe Payment Integration Guide

This document explains how the Stripe payment integration has been implemented in the AI HelpDesk Portal.

## What's Been Added

### 1. Stripe Buy Button Script
The Stripe Buy Button script is loaded in `index.html`:
```html
<script async src="https://js.stripe.com/v3/buy-button.js"></script>
```

### 2. Stripe Buy Button Component
The Pro plan uses the Stripe Buy Button component which handles checkout directly:
```jsx
<stripe-buy-button
  buy-button-id="buy_btn_1RZRDPDPjjPcAkxqVxIC4Uy7"
  publishable-key="pk_live_51OPtxUDPjjPcAkxqmjcKCty6rLE1ASSfGq0KbpNdtIy6UXhx8G6XmdFuxqtla5qS2EnBLZju8PqUHj8xP1IecOVd00OA4vyJhK"
></stripe-buy-button>
```

### 3. TypeScript Support
Type declarations for the Stripe Buy Button have been added to `src/vite-env.d.ts`.

### 4. Custom CSS
Custom styles have been added to ensure the Buy Button displays properly within the pricing card.

### 5. Payment Success Page
A new payment success page has been created at `src/pages/PaymentSuccess.tsx` that users will see after completing their subscription.

### 6. Pricing Structure
Currently, only the **Pro plan** is available at **$25/month** for "Agentic-IT-support". The Starter and Enterprise plans are marked as "Coming Soon" and are disabled.

## How It Works

1. **Landing Page**: Users see three pricing plans with only the Pro plan currently active
2. **Pro Plan Features**: 
   - 1 AI Support Agent
   - 100MB Documentation Upload
   - Advanced Analytics
   - Sentiment Analysis
3. **Payment**: Pro plan uses the Stripe Buy Button component for embedded checkout
4. **After Payment**: Users are redirected to `/payment-success` page
5. **Next Steps**: From the success page, users can navigate to the dashboard to create their AI agent

## Configuration

To configure Stripe for your environment:

1. **Buy Button**: Update the `buy-button-id` and `publishable-key` in the stripe-buy-button component
2. **Success URL**: Configure your Stripe product to redirect to `https://yourdomain.com/payment-success` after successful payment

## Testing

To test the integration:
1. Navigate to the pricing section
2. The Pro plan will show the Stripe Buy Button
3. Click the button to open the Stripe checkout
4. Complete the payment process
5. Verify you're redirected to the payment success page
6. Check that you can navigate to the dashboard

## Next Steps

For a complete integration, you should:
1. Set up Stripe webhooks to update user subscription status in your database
2. Add subscription status checking in the Dashboard component
3. Implement proper authentication flow with Supabase
4. Add environment variables for Stripe configuration 