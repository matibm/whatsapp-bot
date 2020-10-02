const cheerio = require('cheerio');
const request = require('request-promise');
async function getCambio(moneda) {
    const $ = await request({
        uri: 'https://www.cambioschaco.com.py/perfil-de-moneda/?currency=usd',
        transform: body => cheerio.load(body)

    });
    // console.log('webscraping a cambioschaco dolar compra: ' + $('#exchange-'+moneda).find('.purchase').html() + ' venta: ' + $('#exchange-usd').find('.sale').html());
    let compra = $('#exchange-' + moneda).find('.purchase').html()
    let venta = $('#exchange-' + moneda).find('.sale').html()
    return { compra: compra, venta: venta };
}

module.exports = getCambio()