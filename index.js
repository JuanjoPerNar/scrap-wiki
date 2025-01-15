const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');

const app = express();
const PORT = 3000;

const url = 'https://es.wikipedia.org/wiki/Categor%C3%ADa:M%C3%BAsicos_de_rap';

app.get('/', (req, res) => {
    axios.get(url).then((response) => {
        if (response.status === 200) {
            const html = response.data;
            const $ = cheerio.load(html);

            const datosPagina = [];

            $('#mw-pages a').each((index, element) => {
                const link = $(element).attr('href');
                if (link) {
                    const linkCorrecto = link.includes('http') ? link : `https://es.wikipedia.org${link}`;
                    const nombreArtista = $(element).text();

                    datosPagina.push(
                        axios.get(linkCorrecto).then((response) => {
                            const artistaHTML = response.data;
                            const $artista = cheerio.load(artistaHTML);

                            const imagenes = [];


                            //Aquí pido ayuda a la IA para poder acceder a la imagen principal con el selector que usa Wikipedia para estas imágenes
                            $artista('.mw-parser-output img').each((_, img) => { 
                                const src = $artista(img).attr('src');
                                if (src) {
                                    const imagenCorrecta = src.includes('//') ? `https:${src}` : `https://es.wikipedia.org${src}`;
                                    imagenes.push(imagenCorrecta);
                                }
                            });

                            return {
                                texto: linkCorrecto,
                                title: nombreArtista,
                                imgs: imagenes[0] || '',
                            };
                        })
                    );
                }
            });

            Promise.all(datosPagina).then((resultados) => {
                res.json(resultados);
            });
        } else {
            res.status(500).send('Error al cargar la página');
        }
    }).catch((error) => {
        console.error('Error al hacer el scraping', error);
        res.status(500).send('Error al hacer el scraping');
    });
});

app.listen(PORT, () => {
    console.log(`El servidor está ejecutándose en el puerto http://localhost:${PORT}`);
});
