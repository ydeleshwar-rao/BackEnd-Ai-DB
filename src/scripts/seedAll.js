// src/scripts/seedAll.js
const fetch = require('node-fetch'); // npm i node-fetch@2

const BASE_URL = 'http://localhost:3000/api';

// 🔹 Customers
const customers = [
  { name: 'Rahul Sharma', email: 'rahul.s@gmail.com', phone: '9876543210', address: 'Andheri East, Mumbai' },
  { name: 'Priyanka Verma', email: 'priyanka.v@gmail.com', phone: '9123456780', address: 'Indiranagar, Bengaluru' },
  { name: 'Amit R. Patel', email: 'amit.patel@gmail.com', phone: '9988776655', address: 'Satellite Area, Ahmedabad' },
  { name: 'Sneha S. Iyer', email: 'sneha.iyer@gmail.com', phone: '9012345678', address: 'Adyar Main Road, Chennai' },
  { name: 'Rohit K. Singh', email: 'rohit.singh@gmail.com', phone: '9090909090', address: 'Sector 62, Noida' },
  { name: 'Ankit Mishra', email: 'ankit.mishra@gmail.com', phone: '8887766554', address: 'Alambagh, Lucknow' },
  { name: 'Neha Kapoor', email: 'neha.kapoor@gmail.com', phone: '7999887766', address: 'Model Town Phase 2, Delhi' }
];

// 🔹 Job types
const jobTypes = [
  'AC Gas Refill', 'AC Installation', 'Washing Machine Drum Repair',
  'Refrigerator Cooling Issue', 'RO Water Purifier Service',
  'Microwave Oven Repair', 'Geyser Installation', 'TV Screen Repair'
];

// 🔹 Technicians
const technicians = [
  'Suresh Kumar','Ramesh Yadav','Vikram Chauhan','Manoj Gupta',
  'Deepak Meena','Arjun Rao','Santosh Patil'
];

// 🔹 POST helper
async function post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const json = await res.json();
  if (!res.ok) {
    console.error('❌ API ERROR:', json);
    throw new Error(json.message);
  }
  return json.data;
}

// 🔹 Main Seed Function
async function seedViaAPI() {
  for (const customer of customers) {
    // Create Customer
    const createdCustomer = await post(`${BASE_URL}/customers`, customer);
    console.log(`👤 Customer created: ${createdCustomer.name}`);

    // Create 2 Jobs per customer
    for (let i = 0; i < 2; i++) {
      const job = await post(`${BASE_URL}/jobs`, {
        customer_id: createdCustomer.id,
        job_type: jobTypes[Math.floor(Math.random() * jobTypes.length)],
        status: i === 0 ? 'pending' : 'success'
      });
      console.log(`  🛠 Job created (${job.status})`);

      // Create Booking for Job
      await post(`${BASE_URL}/bookings`, {
        job_id: job.job_id,
        technician: technicians[Math.floor(Math.random() * technicians.length)],
        scheduled_date: new Date(Date.now() + Math.floor(Math.random() * 7 + 1) * 86400000)
      });
      console.log(`    📅 Booking created`);
    }
  }
}

// 🔹 Run directly if this file executed
(async function run() {
  try {
    await seedViaAPI();
    console.log('✅ All seed data created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
})();
