# 💖 DateSpots – Discover & Share Great Date Ideas

A cozy, crowdsourced guide to the **best date spots** in town.  
Add your favorite places, rate others’ picks, and let the most romantic spots rise to the top—  
built with **Next.js + Firebase** for a snappy, real-time experience.

---

## ✨ Features
- 📍 **Browse & Discover** – Explore a live feed of date spots with details like  
  name, location, category, price level, and a short description.
- 💕 **Rate with Hearts** – Vote for your favorites to help the best places shine.
- ➕ **Add New Spots** – Share your own secret hideouts instantly.
- ⚡ **Real-Time Updates** – See new spots and ratings appear without refreshing.

---

## 🏗️ Tech Stack
| Layer          | Technology                                                                                    |
| -------------- | --------------------------------------------------------------------------------------------- |
| **Frontend**   | [Next.js](https://nextjs.org/) (Pages Router) + TypeScript                                    |
| **Styling**    | [Tailwind CSS](https://tailwindcss.com/)                                                      |
| **Database**   | [Firebase Cloud Firestore](https://firebase.google.com/docs/firestore) (real-time onSnapshot) |
| **Hosting**    | Local dev server → deploy to Vercel or Firebase Hosting                                       |
| **State Mgmt** | React hooks (`useState`, `useEffect`)                                                         |

---

## 📂 Project Structure
```
date-spots/
├─ components/
│  ├─ AddDateForm.tsx      # Form to add a new spot
│  └─ DateCard.tsx         # UI for each date spot
├─ lib/
│  └─ firebase.ts          # Firebase config & initialization
├─ pages/
│  └─ index.tsx            # Main page (listing & rating logic)
├─ types.ts                # DateSpot interface
├─ tailwind.config.js
└─ ...
```

-

## 🌱 Roadmap
- 🔑 Firebase Auth for user accounts
- 🗺️ Map view for spots
- 📸 Image uploads
- 🎨 Theme customization (dark mode!)

---

## 🤝 Contributing
Pull requests are welcome!  
For major changes, open an issue first to discuss what you’d like to add or change.

---

## 📜 License
MIT – feel free to use and remix.  

---

## 💡 Inspiration
Built to share the kind of **personal, thoughtful** date spots  
you’d send to someone special  
because the best memories start with the right place.
