console.log("Main.JS loaded");

async function api(method, url, body) {
    const res = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
    });

    return await res.json();
}

async function loadTopics() {
    const data = await api('GET', '/api/topics');

    const list = document.getElementById('topics-list');

    list.innerHTML = data.topics.map(t => `
        <div class="topic">
            <h3>${t.title}</h3>
            <p>${t.body}</p>
        </div>
        `).join('');

    console.log(data);
}

loadTopics();