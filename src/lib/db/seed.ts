import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const sql = postgres(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log("Seeding database...");

  // Users
  const [landlord1] = await db
    .insert(schema.users)
    .values({
      name: "Ram Adhikari",
      phone: "+9779876543210",
      email: "ram@example.com",
      role: "landlord",
      trustScore: "85.50",
      isPhoneVerified: true,
    })
    .returning();

  const [landlord2] = await db
    .insert(schema.users)
    .values({
      name: "Sita Gurung",
      phone: "+9779876543211",
      email: "sita@example.com",
      role: "landlord",
      trustScore: "92.00",
      isPhoneVerified: true,
      isIdVerified: true,
    })
    .returning();

  const [landlord3] = await db
    .insert(schema.users)
    .values({
      name: "Bikash Thapa",
      phone: "+9779876543212",
      role: "landlord",
      trustScore: "78.00",
      isPhoneVerified: true,
    })
    .returning();

  const [tenant1] = await db
    .insert(schema.users)
    .values({
      name: "Anita Tamang",
      phone: "+9779876543213",
      email: "anita@example.com",
      role: "tenant",
      isPhoneVerified: true,
    })
    .returning();

  const [tenant2] = await db
    .insert(schema.users)
    .values({
      name: "Suresh Rai",
      phone: "+9779876543214",
      role: "tenant",
      isPhoneVerified: true,
    })
    .returning();

  console.log(`Created ${5} users`);

  // Listings (prices in paisa — smallest currency unit, 100 paisa = 1 NPR)
  const listingsData: (typeof schema.listings.$inferInsert)[] = [
    {
      landlordId: landlord1.id,
      title: "Spacious Room near Tribhuvan University",
      description:
        "Well-ventilated single room in a quiet residential area, 10 minutes walk from Tribhuvan University Kirtipur Campus. Shared kitchen and bathroom. Ideal for students. Landlord lives on premises, ensuring safety. Local bazaar within walking distance.",
      priceMonthly: 800000,
      deposit: 1600000,
      propertyType: "room",
      latitude: 27.6811,
      longitude: 85.2782,
      address: "Kirtipur-4, Near TU Main Gate",
      city: "Kathmandu",
      neighborhood: "Kirtipur",
      amenities: { WiFi: true, "Water Supply": true, Security: true },
      photos: [
        { url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&h=400&fit=crop", order: 0, alt: "Bright single room with bed and desk" },
        { url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop", order: 1, alt: "Room interior view" },
      ],
      isVerified: true,
      isActive: true,
      availableFrom: "2026-04-01",
    },
    {
      landlordId: landlord1.id,
      title: "Budget PG for Students near Ratna Park",
      description:
        "Triple sharing PG accommodation with meals included. Close to New Road and Ratna Park bus stop. Walking distance to multiple colleges. Best for students from outside the valley.",
      priceMonthly: 500000,
      deposit: 500000,
      propertyType: "pg",
      latitude: 27.7050,
      longitude: 85.3145,
      address: "Bag Bazaar, Near Ratna Park",
      city: "Kathmandu",
      neighborhood: "Bag Bazaar",
      amenities: { WiFi: true, "Water Supply": true, Kitchen: true },
      photos: [
        { url: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&h=400&fit=crop", order: 0, alt: "Shared dormitory room" },
        { url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop", order: 1, alt: "Common area" },
      ],
      isVerified: true,
      isActive: true,
      availableFrom: "2026-03-25",
    },
    {
      landlordId: landlord2.id,
      title: "Modern Apartment in Jhamsikhel",
      description:
        "Fully furnished 2-room apartment in the heart of Jhamsikhel, close to cafes, offices, and UN agencies. Gated community with 24/7 security and parking. Perfect for young professionals.",
      priceMonthly: 2500000,
      deposit: 5000000,
      propertyType: "apartment",
      latitude: 27.6731,
      longitude: 85.3163,
      address: "Jhamsikhel Marg, Lalitpur",
      city: "Lalitpur",
      neighborhood: "Jhamsikhel",
      amenities: { WiFi: true, AC: true, Parking: true, "Power Backup": true, Furnished: true, Security: true, CCTV: true },
      photos: [
        { url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop", order: 0, alt: "Modern apartment living room" },
        { url: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&h=400&fit=crop", order: 1, alt: "Kitchen area" },
        { url: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=600&h=400&fit=crop", order: 2, alt: "Bedroom" },
      ],
      isVerified: true,
      isActive: true,
      availableFrom: "2026-04-15",
    },
    {
      landlordId: landlord2.id,
      title: "Girls PG near Patan Multiple Campus",
      description:
        "Clean and comfortable PG accommodation for girls. Double sharing rooms with attached bathroom. Home-cooked meals, WiFi, and laundry included. 5 minutes from Patan Multiple Campus.",
      priceMonthly: 700000,
      deposit: 700000,
      propertyType: "pg",
      latitude: 27.6727,
      longitude: 85.3250,
      address: "Mangal Bazaar, Near Patan Durbar Square",
      city: "Lalitpur",
      neighborhood: "Mangal Bazaar",
      amenities: { WiFi: true, Laundry: true, "Water Supply": true, Security: true },
      photos: [
        { url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&h=400&fit=crop", order: 0, alt: "Clean shared room" },
        { url: "https://images.unsplash.com/photo-1598928506311-c55ez637a4c1?w=600&h=400&fit=crop", order: 1, alt: "Bathroom" },
      ],
      isVerified: true,
      isActive: true,
      availableFrom: "2026-03-20",
    },
    {
      landlordId: landlord3.id,
      title: "Hostel Bed near Lakeside",
      description:
        "Affordable hostel accommodation in Lakeside Pokhara. 6-bed dormitory with individual lockers, common kitchen, and rooftop with mountain views. Great for newcomers to Pokhara.",
      priceMonthly: 400000,
      deposit: 400000,
      propertyType: "hostel",
      latitude: 28.2096,
      longitude: 83.9563,
      address: "Lakeside Marg, Baidam",
      city: "Pokhara",
      neighborhood: "Lakeside",
      amenities: { WiFi: true, Kitchen: true, "Water Supply": true, Security: true },
      photos: [
        { url: "https://images.unsplash.com/photo-1520277739336-7bf67edfa768?w=600&h=400&fit=crop", order: 0, alt: "Hostel dormitory beds" },
        { url: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=600&h=400&fit=crop", order: 1, alt: "Rooftop mountain view" },
        { url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop", order: 2, alt: "Common kitchen" },
      ],
      isVerified: false,
      isActive: true,
      availableFrom: "2026-04-01",
    },
    {
      landlordId: landlord3.id,
      title: "Furnished Room in Thamel",
      description:
        "Semi-furnished single room in a shared flat in Thamel. Central location, walking distance to everything. Quiet side street away from the main tourist area. Ideal for young professionals and students.",
      priceMonthly: 1200000,
      deposit: 2400000,
      propertyType: "room",
      latitude: 27.7153,
      longitude: 85.3123,
      address: "Thamel Marg, Kathmandu",
      city: "Kathmandu",
      neighborhood: "Thamel",
      amenities: { WiFi: true, Furnished: true, "Water Supply": true, Security: true },
      photos: [
        { url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&h=400&fit=crop", order: 0, alt: "Furnished room with wooden floor" },
        { url: "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=600&h=400&fit=crop", order: 1, alt: "Window view" },
      ],
      isVerified: true,
      isActive: true,
      availableFrom: "2026-04-10",
    },
    {
      landlordId: landlord2.id,
      title: "2-Room Flat near Balkumari IT Park",
      description:
        "Spacious 2-room flat in Balkumari, 10 minutes from Kathmandu University and nearby IT companies. Fully furnished with modern kitchen and balcony. Gated compound with parking.",
      priceMonthly: 1800000,
      deposit: 3600000,
      propertyType: "apartment",
      latitude: 27.6685,
      longitude: 85.3407,
      address: "Balkumari Road, Lalitpur",
      city: "Lalitpur",
      neighborhood: "Balkumari",
      amenities: { WiFi: true, Furnished: true, Parking: true, "Power Backup": true, Security: true, CCTV: true },
      photos: [
        { url: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&h=400&fit=crop", order: 0, alt: "Spacious living room" },
        { url: "https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=600&h=400&fit=crop", order: 1, alt: "Modern kitchen" },
        { url: "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&h=400&fit=crop", order: 2, alt: "Bedroom with balcony" },
      ],
      isVerified: true,
      isActive: true,
      availableFrom: "2026-04-01",
    },
    {
      landlordId: landlord1.id,
      title: "Student Hostel near Pulchowk Campus",
      description:
        "Co-living hostel for engineering students near IOE Pulchowk Campus. Twin sharing rooms, study area, common room with TV, and mess facility. Regular bus service to campus.",
      priceMonthly: 600000,
      deposit: 600000,
      propertyType: "hostel",
      latitude: 27.6812,
      longitude: 85.3189,
      address: "Pulchowk, Near IOE Campus",
      city: "Lalitpur",
      neighborhood: "Pulchowk",
      amenities: { WiFi: true, "Water Supply": true, Security: true },
      photos: [
        { url: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&h=400&fit=crop", order: 0, alt: "Hostel twin room" },
        { url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop", order: 1, alt: "Study area" },
      ],
      isVerified: false,
      isActive: true,
      availableFrom: "2026-03-28",
    },
    {
      landlordId: landlord3.id,
      title: "Room near Biratnagar Multiple Campus",
      description:
        "Simple furnished room ideal for students at Biratnagar Multiple Campus. Quiet neighborhood with local shops nearby. Affordable and safe area.",
      priceMonthly: 350000,
      deposit: 350000,
      propertyType: "room",
      latitude: 26.4525,
      longitude: 87.2718,
      address: "Mahendra Chowk, Biratnagar",
      city: "Biratnagar",
      neighborhood: "Mahendra Chowk",
      amenities: { WiFi: true, "Water Supply": true },
      photos: [
        { url: "https://images.unsplash.com/photo-1598928506311-c55ece637a4c?w=600&h=400&fit=crop", order: 0, alt: "Simple furnished room" },
      ],
      isVerified: true,
      isActive: true,
      availableFrom: "2026-04-05",
    },
    {
      landlordId: landlord2.id,
      title: "Modern Room in Bharatpur for Students",
      description:
        "Newly built room with attached bathroom near Chitwan Medical College. Modern amenities, peaceful environment. Perfect for medical and engineering students in Bharatpur.",
      priceMonthly: 600000,
      deposit: 1200000,
      propertyType: "room",
      latitude: 27.6833,
      longitude: 84.4333,
      address: "Bharatpur-10, Near CMC",
      city: "Bharatpur",
      neighborhood: "Bharatpur-10",
      amenities: { WiFi: true, "Water Supply": true, "Power Backup": true, Furnished: true },
      photos: [
        { url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop", order: 0, alt: "Modern bedroom" },
        { url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&h=400&fit=crop", order: 1, alt: "Attached bathroom" },
      ],
      isVerified: true,
      isActive: true,
      availableFrom: "2026-04-01",
    },
  ];

  const insertedListings = await db
    .insert(schema.listings)
    .values(listingsData)
    .returning();

  console.log(`Created ${insertedListings.length} listings`);

  // Reviews
  const reviewsData = [
    {
      listingId: insertedListings[0].id,
      reviewerId: tenant1.id,
      rating: 4 as const,
      text: "Good room, clean and well-maintained. Landlord is helpful. Only issue is occasional water shortage. Overall great for TU students on a budget.",
      isVerifiedStay: true,
    },
    {
      listingId: insertedListings[0].id,
      reviewerId: tenant2.id,
      rating: 5 as const,
      text: "Best place near TU campus. Very safe area and close to everything. Ram dai is very accommodating.",
      isVerifiedStay: true,
    },
    {
      listingId: insertedListings[2].id,
      reviewerId: tenant1.id,
      rating: 5 as const,
      text: "Amazing apartment! Fully furnished, great location in Jhamsikhel. Everything is walkable. Totally worth the price for professionals.",
      isVerifiedStay: true,
    },
    {
      listingId: insertedListings[3].id,
      reviewerId: tenant2.id,
      rating: 4 as const,
      text: "Clean PG with good food. The location near Patan campus is perfect. Very safe for girls.",
      isVerifiedStay: false,
    },
    {
      listingId: insertedListings[5].id,
      reviewerId: tenant1.id,
      rating: 4 as const,
      text: "Thamel is a great area to live. The room is decent and flatmates are friendly. A bit noisy on weekends but manageable.",
      isVerifiedStay: true,
    },
    {
      listingId: insertedListings[6].id,
      reviewerId: tenant2.id,
      rating: 5 as const,
      text: "Perfect for IT professionals working in Balkumari area. The flat has everything you need. Very modern.",
      isVerifiedStay: true,
    },
    {
      listingId: insertedListings[9].id,
      reviewerId: tenant1.id,
      rating: 4 as const,
      text: "Nice room in Bharatpur. Very close to CMC. The area is developing fast with lots of food options nearby.",
      isVerifiedStay: false,
    },
  ];

  await db.insert(schema.reviews).values(reviewsData);
  console.log(`Created ${reviewsData.length} reviews`);

  // Points of Interest
  const poisData = [
    // Kathmandu
    { name: "Tribhuvan University", category: "university" as const, latitude: 27.6811, longitude: 85.2782, city: "Kathmandu" },
    { name: "Ratna Park Bus Stop", category: "transit" as const, latitude: 27.7050, longitude: 85.3145, city: "Kathmandu" },
    { name: "Bir Hospital", category: "hospital" as const, latitude: 27.7048, longitude: 85.3134, city: "Kathmandu" },
    { name: "New Road Market", category: "market" as const, latitude: 27.7038, longitude: 85.3133, city: "Kathmandu" },
    { name: "Thamel", category: "market" as const, latitude: 27.7153, longitude: 85.3123, city: "Kathmandu" },
    { name: "Gongabu Bus Park", category: "transit" as const, latitude: 27.7321, longitude: 85.3125, city: "Kathmandu" },
    // Lalitpur
    { name: "IOE Pulchowk Campus", category: "university" as const, latitude: 27.6812, longitude: 85.3189, city: "Lalitpur" },
    { name: "Kathmandu University (Balkumari)", category: "university" as const, latitude: 27.6685, longitude: 85.3407, city: "Lalitpur" },
    { name: "Patan Hospital", category: "hospital" as const, latitude: 27.6696, longitude: 85.3190, city: "Lalitpur" },
    { name: "Patan Durbar Square", category: "market" as const, latitude: 27.6727, longitude: 85.3250, city: "Lalitpur" },
    // Pokhara
    { name: "Pokhara University", category: "university" as const, latitude: 28.1905, longitude: 83.9758, city: "Pokhara" },
    { name: "Prithvi Narayan Campus", category: "university" as const, latitude: 28.2169, longitude: 83.9582, city: "Pokhara" },
    { name: "Lakeside", category: "market" as const, latitude: 28.2096, longitude: 83.9563, city: "Pokhara" },
    { name: "Manipal Hospital Pokhara", category: "hospital" as const, latitude: 28.2122, longitude: 83.9876, city: "Pokhara" },
    // Biratnagar
    { name: "Biratnagar Multiple Campus", category: "university" as const, latitude: 26.4525, longitude: 87.2718, city: "Biratnagar" },
    { name: "Biratnagar Bus Park", category: "transit" as const, latitude: 26.4543, longitude: 87.2750, city: "Biratnagar" },
    // Bharatpur
    { name: "Chitwan Medical College", category: "university" as const, latitude: 27.6833, longitude: 84.4333, city: "Bharatpur" },
    { name: "Bharatpur Hospital", category: "hospital" as const, latitude: 27.6780, longitude: 84.4310, city: "Bharatpur" },
    { name: "Narayanghat Bus Park", category: "transit" as const, latitude: 27.6948, longitude: 84.4293, city: "Bharatpur" },
    // Bhaktapur
    { name: "Khwopa Engineering College", category: "university" as const, latitude: 27.6710, longitude: 85.4298, city: "Bhaktapur" },
  ];

  await db.insert(schema.pois).values(poisData);
  console.log(`Created ${poisData.length} POIs`);

  // Conversations
  await db.insert(schema.conversations).values([
    {
      listingId: insertedListings[0].id,
      tenantId: tenant1.id,
      landlordId: landlord1.id,
      status: "active" as const,
    },
    {
      listingId: insertedListings[2].id,
      tenantId: tenant1.id,
      landlordId: landlord2.id,
      status: "initiated" as const,
    },
    {
      listingId: insertedListings[5].id,
      tenantId: tenant2.id,
      landlordId: landlord3.id,
      status: "active" as const,
    },
  ]);
  console.log("Created 3 conversations");

  console.log("\nSeed complete!");
  await sql.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
