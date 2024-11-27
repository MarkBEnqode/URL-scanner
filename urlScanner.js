// This code is a tool for efficiently fetching data from multiple URLs while avoiding overloading the server
//  or being blocked. 
//  Key Features:
// Concurrency Management: Limits the number of requests running at the same time to avoid overloading servers.
// Delays: Introduces gaps between batches of requests to reduce detection.
// Error Handling: Logs failed requests but ensures the process continues.
// User-Agent Rotation: Makes requests appear as if they come from different devices/browsers.

// #**************************************************************************************************************#

const axios = require('axios');
const pLimit = require('p-limit');

// Function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch data with a concurrency limit
async function fetchUrls(urls, concurrency = 5, delayMs = 500) {
    const limit = pLimit(concurrency);
    let allDatas = {};

    // Function to fetch a single URL
    const fetchUrl = async (url) => {
        try {
            const { data } = await axios.get(url, {
                headers: {
                    'User-Agent': getRandomUserAgent(), // Rotate User-Agent
                },
                timeout: 5000, // Set a timeout
            });
            return { url, data };
        } catch (error) {
            console.error('Error fetching URL:', url, error.message);
            return { url, data: null }; // Return null for failed requests
        }
    };

    // Iterate over URLs and fetch them with limited concurrency
    const tasks = urls.map((url, index) =>
        limit(async () => {
            if (index > 0 && index % concurrency === 0) {
                await delay(delayMs); // Add delay between batches
            }
            return await fetchUrl(url);
        })
    );

    const results = await Promise.all(tasks);
    results.forEach(({ url, data }) => {
        if (data) {
            allDatas[url] = data;
        }
    });

    return allDatas;
}

// Generate a random user agent
function getRandomUserAgent() {
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0',
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}
