const baseUrl = "http://localhost:4000"
// const baseUrl = "https://dev2.tracksend.co",

const sendToTracksendUrl = '/api/shopifyevents'
const sendToTracksend = async (action, data, shop) => {
    const resp = await fetch(`${baseUrl}${sendToTracksendUrl}`, {
        method: 'POST',
        body: JSON.stringify({
            shop, action, data
        })
    })
    const result = await resp.json();    
}

module.exports = sendToTracksend;