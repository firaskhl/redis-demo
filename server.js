const express = require("express")
const axios = require("axios")
const cors = require("cors")
const Redis = require("redis")

const DEFAULT_EXPIRATION = 3600

const app = express()
app.use(cors())

const redisClient = Redis.createClient()

redisClient.on("error", (err) => console.log("Redis Client Error", err))

redisClient.connect()

async function getOrSetCache(key, cb) {
    try {
        const data = await redisClient.get(key)
        if (data != null) {
            console.log("From Cache")
            return JSON.parse(data)
        }

        console.log("Not in Cache")
        const freshData = await cb()
        await redisClient.setEx(key, DEFAULT_EXPIRATION, JSON.stringify(freshData))
        return freshData

    } catch (err) {
        console.log(err)
    }
}

app.get("/photos", async(req, res) => {
    const albumId = req.query.albumId
    const photos = await getOrSetCache("photos", async() => {
        const { data } = await axios.get("https://jsonplaceholder.typicode.com/photos/",
        {params : { albumId }}
        )
        return data
    })

    res.json(photos)
})

app.get("/photo/:id", async(req, res) => {
    const albumId = req.query.albumId
    const { data } = await axios.get(
        `https://jsonplaceholder.typicode.com/photos/${req.params.id}`,
    )

    res.json(data)
})


app.listen(3000)