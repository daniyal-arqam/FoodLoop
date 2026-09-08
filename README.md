# FoodLoop

**Live demo:** [https://food-loop-theta.vercel.app](https://food-loop-theta.vercel.app)

FoodLoop is a food-rescue product. It connects kitchens that have edible leftover food with nearby community organizations that can collect and distribute it the same day — before that food expires and gets thrown away.

## The idea

Right now, surplus food usually moves through chat groups and phone calls. Someone posts “we have 40 meals left,” someone else says they’ll pick them up, then nobody updates the thread. The same tray gets promised twice, or nobody comes, and the food is wasted.

FoodLoop gives that process a single place to live:

- A **provider** (restaurant, cafeteria, event kitchen) publishes what they have, how much, and when it must be picked up.
- An **admin** verifies community organizations so random accounts cannot claim food.
- A **verified organization** browses what’s available, sees which listing fits them best, claims it, and marks it collected.

One listing has one clear status — available, reserved, or collected — so the same surplus cannot be double-booked.

## Who it’s for

| Who | What they need |
|-----|----------------|
| Food providers | A fast way to list surplus instead of dumping it |
| Community kitchens / NGOs | A reliable feed of nearby food they are allowed to claim |
| Admins | Control over who can claim, and a view of what’s being rescued |

## What happens in the product

1. Provider creates a listing (food type, quantity, pickup window, expiry).
2. Organizations browse open listings and review a match score (distance, quantity, category, urgency).
3. One organization reserves the listing.
4. After pickup, they mark it collected.
5. If time runs out with no pickup, the listing expires.

FoodLoop also includes an AI helper for waste-reduction tips, basic food-safety questions, and matching guidance — tied to the same live listings, not a separate toy chatbot.

FoodLoop is a **coordination** tool. It does not take payments or run a marketplace checkout.

## Tech stack

| Area | Tools |
|------|--------|
| Frontend | React, Vite, React Router |
| Backend | Node.js, Express (API gateway + auth / food / organization services) |
| Matching & AI | Python, FastAPI, FAISS (RAG); OpenAI optional |
| Database | MongoDB |
| Auth | JWT, bcrypt, Google sign-in |
| Infra | Docker Compose; live UI on Vercel, APIs on an always-on VPS |

## Try it

Open the live app: [https://food-loop-theta.vercel.app](https://food-loop-theta.vercel.app)

You can create an account, or use the seed walkthrough in [docs/DEMO.md](docs/DEMO.md) if you are exploring the full flow locally.

**Author:** Daniyal Arqam
