const fetch = require("node-fetch");

async function testTokenEndpoint() {
  const url =
    "https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=4d4827c5d5196a6ed517a01266e959fc&access_token=dummy_token";

  const resGet = await fetch(url, { method: "GET" });
  console.log("GET status:", resGet.status);
  console.log("GET body:", await resGet.json());

  const resPost = await fetch(url, { method: "POST" });
  console.log("POST status:", resPost.status);
  console.log("POST body:", await resPost.json());
}

testTokenEndpoint();
