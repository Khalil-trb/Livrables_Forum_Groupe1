console.log("Main.JS loaded");

async function api(method, url, body) {
    const res = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || "Request failed");
    }
    return data;
}

async function loadTopics() {
    const list = document.getElementById('topics-list');
    if (!list) return;

    try {
        const data = await api('GET', '/api/threads');
        const threads = data.threads || [];
        if (!threads.length) {
            list.innerHTML = '<p>Aucun sujet pour le moment.</p>';
            return;
        }

        list.innerHTML = threads.map(t => `
            <div class="topic">
                <h3>${t.title}</h3>
                <p>${t.content}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error(error);
        list.innerHTML = '<p>Impossible de charger les sujets pour le moment.</p>';
    }
}

loadTopics();
