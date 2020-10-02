require('dotenv').config();
const { response } = require('express');
const { google } = require('googleapis');
const express = require('express');
const { reseller } = require('googleapis/build/src/apis/reseller');

// var app = express();
// app.get('/:q', (req, res) => {

//     let query = req.params.q;
//     google.youtube('v3').search.list({
//         key: process.env.YOUTUBE_TOKEN,
//         part: 'snippet',
//         q: query
//     }).then((response) => {
//         let videos = []
//         const { data } = response;
//         data.items.forEach(element => {

//             let video = {
//                 id: element.id.videoId,
//                 title: element.snippet.title,
//                 description: element.snippet.description,
//                 channelTitle: element.snippet.channelTitle
//             }

//             videos.push(video)
//         });

//         res.status(200).json({
//                 ok: true,
//                 items: videos
//             })
//             // console.log(response.config);
//     }).catch((err) => {
//         console.log(err);
//         return res.status(500).json({
//             ok: false,
//             mensaje: 'error buscando videos',
//             errors: err
//         });
//     })
// })



module.exports = async function search(query) {

    return await google.youtube('v3').search.list({
        key: process.env.YOUTUBE_TOKEN,
        part: 'snippet',
        q: query
    }).then((response) => {
        let videos = []
        const { data } = response;
        data.items.forEach(element => {

            let video = {
                id: element.id.videoId,
                title: element.snippet.title,
                description: element.snippet.description,
                channelTitle: element.snippet.channelTitle
            }

            videos.push(video)
        });
        return videos;
        // console.log(response.config);
    }).catch((err) => {
        console.log(err);
        return {
            ok: false,
            mensaje: 'error buscando videos',
            errors: err
        }
    })
}



// exports.searcha = searcha();
// module.exports = app;