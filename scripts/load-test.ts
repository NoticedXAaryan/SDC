import { faker } from '@faker-js/faker';

async function runLoadSanityCheck() {
  console.log("Simulating 150 concurrent reads on Leaderboard...");
  
  const startTime = Date.now();
  const requests = Array.from({ length: 150 }).map(() => fetch('http://localhost:3000/api/engagement/leaderboard').catch(() => null));
  
  await Promise.all(requests);
  const endTime = Date.now();
  
  console.log(`Load test completed in ${endTime - startTime}ms.`);
}

runLoadSanityCheck();
