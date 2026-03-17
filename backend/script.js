const firstNames = [
  "Aarav","Vivaan","Aditya","Arjun","Sai","Krishna","Rohan","Rahul",
  "Karan","Ankit","Nikhil","Siddharth","Harsh","Manish","Deepak",
  "Amit","Rajesh","Suresh","Prakash","Vikram"
];

const lastNames = [
  "Sharma","Verma","Singh","Patel","Kumar","Reddy","Gupta","Mehta",
  "Malhotra","Jain","Yadav","Mishra","Agarwal","Tiwari","Choudhary",
  "Dubey","Khanna","Iyer","Nair","Pillai"
];

const voters = [];

for (let i = 1; i <= 200; i++) {
  const first = firstNames[i % firstNames.length];
  const last = lastNames[i % lastNames.length];

  voters.push({
    voterId: `MH${100000 + i}`,
    fullName: `${first} ${last}`,
    phone: `98765${String(i).padStart(5, "0")}`
  });
}

console.log('voters created ');