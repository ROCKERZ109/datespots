// lib/initialData.ts
import { GeoPoint } from 'firebase/firestore';
import { DateSpot } from '../types';

export const initialDateSpots: DateSpot[] = [
  // Attractions from TripAdvisor with images
  {
    id: '1',
    name: "Liseberg",
    location: "Örgrytevägen 5, Göteborg",
    category: "entertainment",
    priceLevel: 3,
    description: "Scandinavia's largest amusement park with thrilling roller coasters and beautiful gardens. Pro tip: Download their app for virtual queues!",
    rating: 4.0,
    totalVotes: 0,
    tags: ["Amusement Park", "Rides", "Family-Friendly"],
    imageUrl: "https://t3.ftcdn.net/jpg/05/00/57/98/360_F_500579853_iUtfSMCiOp2dgaTmgGyZbzIMHfUWvC4r.jpg",
    createdAt: new Date('2024-01-15'),
    upvotes: 0,
    downvotes: 0,
    // Added fields
    petFriendly: false, // Dogs generally not allowed inside the park/rides
    coordinates:  new GeoPoint(57.69538532530327, 11.992507026982514) // Actual approx coords for Liseberg
  },
  {
    id: '2',
    name: "Slottsskogen",
    location: "Linnéstaden, Göteborg",
    category: "outdoor",
    priceLevel: 1,
    description: "Beautiful park perfect for picnics, walking, and visiting the free zoo with Nordic animals. A former deer-hunting ground transformed into a picturesque urban oasis.",
    rating: 4.5,
    totalVotes: 0,
    tags: ["Park", "Zoo", "Nature"],
    imageUrl: "https://cms.goteborg.com/uploads/2020/12/slottsskogen-promenad-43.jpg",
    createdAt: new Date('2024-01-15'),
    upvotes: 0,
    downvotes: 0,
    // Added fields
    petFriendly: true, // Parks are usually pet-friendly
    coordinates: new GeoPoint(57.68459262015389, 11.944461376143918) // Actual approx coords for Slottsskogen
  },
  {
    id: '3',
    name: "Haga Nygata",
    location: "Haga, Göteborg",
    category: "romantic",
    priceLevel: 2,
    description: "Charming cobblestone street with historic wooden houses, cozy cafés, and boutique shops. Perfect for a romantic stroll.",
    rating: 4.2,
    totalVotes: 0,
    tags: ["Historic Walking Area", "Shopping", "Cafes"],
    imageUrl: "https://cms.goteborg.com/uploads/2020/12/Haga_House-of-Vision_2309_04-scaled.jpg",
    createdAt: new Date('2024-01-15'),
    upvotes: 0,
    downvotes: 0,
    // Added fields
    petFriendly: true, // Outdoor walking areas are usually pet-friendly
    coordinates:  new GeoPoint(57.6985384,11.9519311) // Actual approx coords for Haga
  },
  {
    id: '4',
    name: "The Garden Society (Trädgårdsföreningen)",
    location: "Centrum, Göteborg",
    category: "outdoor",
    priceLevel: 1,
    description: "Historic garden park with palm house, rose garden, and peaceful walking paths. One of Europe's larger botanical gardens.",
    rating: 4.5,
    totalVotes: 0,
    tags: ["Gardens", "Botanical", "Relaxing"],
    imageUrl: "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/18/3e/55/91/ett-maste-nar-man-ar.jpg?w=1200&h=-1&s=1",
    createdAt: new Date('2024-01-15'),
    upvotes: 0,
    downvotes: 0,
    // Added fields
    petFriendly: true, // Gardens are generally pet-friendly (excluding indoor areas)
    coordinates:  new GeoPoint(57.706466354857305, 11.976423265038605) // Actual approx coords
  },
  {
    id: '5',
    name: "Paddan Canal Tours",
    location: "Stenpiren, Göteborg",
    category: "water",
    priceLevel: 2,
    description: "Guided boat tours through the canals and under bridges of Gothenburg. Great way to see the city from a different perspective!",
    rating: 4.6,
    totalVotes: 0,
    tags: ["Boat Tour", "Canal", "Sightseeing"],
    imageUrl: "https://cms.goteborg.com/uploads/2020/11/paddan-43-1-2048x1536.jpg",
    createdAt: new Date('2024-01-15'),
    upvotes: 0,
    downvotes: 0,
    // Added fields
    petFriendly: false, // May not be allowed on the specific tour boats
    coordinates:  new GeoPoint(57.70377425750224, 11.970010467511406)// Actual approx coords for Stenpiren
  },
  {
    id: '6',
    name: "Upper House Spa",
    location: "Brunnsparken, Göteborg",
    category: "romantic",
    priceLevel: 4,
    description: "Luxury spa with panoramic views from the top of Gothia Towers. Perfect for a special occasion or treat yourself moment.",
    rating: 4.5,
    totalVotes: 0,
    tags: ["Spa", "Luxury", "Relaxation"],
    imageUrl: "https://en.upperhouse.se/uploads/sites/79/2018/11/1920-1080-upper-house-winter.jpg",
    createdAt: new Date('2024-01-15'),
    upvotes: 0,
    downvotes: 0,
    // Added fields
    petFriendly: false, // Spas are not pet-friendly
    coordinates:  new GeoPoint(57.69747828433729, 11.988963013621454) // Actual approx coords for Gothia Towers
  },
  {
    id: '7',
    name: "Gothenburg Botanical Garden",
    location: "Änggårdsbergen, Göteborg",
    category: "outdoor",
    priceLevel: 2,
    description: "One of Europe's larger botanical gardens with 16,000 plant species. Beautiful any time of year!",
    rating: 4.3,
    totalVotes: 0,
    tags: ["Botanical Garden", "Nature", "Plants"],
    imageUrl: "https://swedishgardens.se/wp-content/uploads/2019/10/botaniska-1.jpg",
    createdAt: new Date('2024-01-15'),
    upvotes: 0,
    downvotes: 0,
    // Added fields
    petFriendly: true, // Outdoor garden is usually pet-friendly
    coordinates:  new GeoPoint(57.682950855202265, 11.950344819768201) // Actual approx coords
  },
  {
    id: '8',
    name: "Sjömanstornet",
    location: "Majorna, Göteborg",
    category: "view",
    priceLevel: 1,
    description: "Observation tower offergiting panoramic views over Gothenburg and the archipelago. Great for sunset views!",
    rating: 4.6,
    totalVotes: 0,
    tags: ["Observation Tower", "Viewpoint", "Panoramic"],
    imageUrl: "https://www.mikaelsvensson.com/photo/wp-content/uploads/2022/11/221118108.jpg",
    createdAt: new Date('2024-01-15'),
    upvotes: 0,
    downvotes: 0,
    // Added fields
    petFriendly: true, // Typically allowed in outdoor viewing areas
    coordinates:  new GeoPoint(57.69956727968238, 11.932173515992389)// Actual approx coords
  },
  
  // Top restaurants with images
  
  {
    id: '10',
    name: "Bord 27",
    location: "Göteborg City",
    category: "food",
    priceLevel: 3,
    description: "European and Swedish cuisine with a modern twist. Cozy atmosphere for intimate conversations.",
    rating: 4.8,
    totalVotes: 0,
    tags: ["European", "Swedish", "Modern"],
    imageUrl: "https://www.gp.se/images/og/75c1a12c-8b54-47d2-a6f3-0f6133be6c95/images/103lOifgX6rIR9F4bkeWlLIPqgdqM.jpg?width=1200&quality=75",
    createdAt: new Date('2024-01-15'),
    upvotes: 0,
    downvotes: 0,
    // Added fields
    petFriendly: false, // Restaurants are typically not pet-friendly inside
    coordinates:  new GeoPoint(57.697285283550336, 11.962909268748772) // Placeholder
  },
  {
    id: '11',
    name: "Heaven 23",
    location: "Gothia Towers, Göteborg",
    category: "food",
    priceLevel: 4,
    description: "Restaurant with panoramic views from the 23rd floor. Perfect for a romantic evening with a view!",
    rating: 4.1,
    totalVotes: 0,
    tags: ["View Restaurant", "Panoramic", "Fine Dining"],
    imageUrl: "https://en.heaven23.se/uploads/sites/34/2016/12/dce4728c-e260-469c-bbc6-e2dce4dfa0ce-1280x800.jpg",
    createdAt: new Date('2024-01-15'),
    upvotes: 0,
    downvotes: 0,
    // Added fields
    petFriendly: false, // Fine dining restaurants are not pet-friendly
    coordinates:  new GeoPoint(57.69762375015898, 11.988522435896453) // Actual approx coords for Gothia Towers
  },

  
  // Additional romantic spots with images
  {
    id: '13',
    name: "Avenyn",
    location: "Göteborg City",
    category: "romantic",
    priceLevel: 2,
    description: "Göteborg's most famous boulevard, lined with shops, restaurants, and cultural venues. Great for an evening stroll.",
    rating: 4.2,
    totalVotes: 0,
    tags: ["Boulevard", "Shopping", "Dining"],
    imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRzjEhv1ihvHMoPXiVQgXrKnD6sPju3caI1ow&s",
    createdAt: new Date('2024-01-15'),
    upvotes: 0,
    downvotes: 0,
    // Added fields
    petFriendly: true, // Outdoor strolling area is pet-friendly
    coordinates:  new GeoPoint(57.70073940412776, 11.974809208891156)// Actual approx coords for Avenyn
  },
  {
    id: '14',
    name: "Vinga",
    location: "Gothenburg Archipelago",
    category: "outdoor",
    priceLevel: 2,
    description: "Beautiful island in the archipelago, birthplace of Swedish poet Evert Taube. Take a ferry for a day trip adventure!",
    rating: 4.6,
    totalVotes: 0,
    tags: ["Island", "Archipelago", "Nature"],
    imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1UptU8LJNmy8Qqp-MYRFANZDBSY9xUpZS0g&s",
    createdAt: new Date('2024-01-15'),
    upvotes: 0,
    downvotes: 0,
    // Added fields
    petFriendly: true, // Outdoor nature areas are typically pet-friendly (check ferry rules)
    coordinates:  new GeoPoint(57.635100343961405, 11.607401414737499) // Actual approx coords for Vinga
  },
  {
    id: '15',
    name: "Champagnebaren",
    location: "Göteborg City",
    category: "romantic",
    priceLevel: 3,
    description: "Elegant champagne bar perfect for a romantic evening. Great for celebrations or just because!",
    rating: 4.2,
    totalVotes: 0,
    tags: ["Bar", "European", "Romantic"],
    imageUrl: "https://res.cloudinary.com/foodfriends/image/upload/w_1200,h_600,c_fill,f_auto,q_auto/restaurant/b587306034d7a8bd9610288998a54f26.jpg",
    createdAt: new Date('2024-01-15'),
    upvotes: 0,
    downvotes: 0,
    // Added fields
    petFriendly: false, // Bars/Restaurants are typically not pet-friendly inside
    coordinates:  new GeoPoint(57.704437493052176, 11.96301539434193) // Placeholder
  }
];