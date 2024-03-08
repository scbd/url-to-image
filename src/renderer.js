const config = require('./config');
const winston = require('./logger')(__filename);
const url       = require('url');
const puppeteer = require('puppeteer');


let startTime;
let lastCall;
let browser;
const cacheControl = 7*24*60*60; //7days

const sleep = (ms)=> new Promise(resolve => setTimeout(resolve, ms));

async function renderUrlToImage(req, res) {
    try{
        const response = await renderImage(req);
    log('response ready to send')

        res.status(200)
        .set({
            'Content-Type': 'image/png'
        })
        .send(response);
    }
    catch (err) {
        log(err);
        res.status(500).send('Error when rendering image');
    }

}

async function initializeChrome(){
    if(!browser){
        browser = await puppeteer.launch({
            executablePath: '/usr/bin/google-chrome',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        //fake page so that if the last tap is closed the instance stays in memory
        const fakePage = await browser.newPage();
        log('Chrome new instance initialized')
    }
    else{
        log('Chrome instance is in memory, reusing...')
    }

    return browser;
}

async function renderImage(req){

    startTime = +new Date();
    lastCall = +new Date();
    let response;
    let page;
    try {        

            const queryString = req.query || {};
            const domain = queryString.domain || 'www.cbd.int';

            let clientUrl = `https://${domain}/biodiversity-day/logo/customize?prerender=true&lang=${queryString.lang}&name=${queryString.name}`
            let elementSelector = '#imgGenerator'
            
            if(!['www.cbd.int', 'www.cbddev.xyz'].includes(domain)){
                log('invalid domain' + domain)
               throw new Error('Invalid domain, ' + domain)
            }

            if(queryString.element)
                elementSelector = queryString.element;

            if(queryString.url)
                clientUrl = queryString.url;

            await initializeChrome();
            page = await browser.newPage();
            // await page.setRequestInterception(true);

            clientUrl = clientUrl.replace(/^\//, '');
            console.log(`Rendering url: ${clientUrl}`)

            page.on('console', async message =>{
                log(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`)
            });

            
            let pdfOpts = {waitUntil : 'networkidle0', timeout:20*1000} //timeout:0 (makes it infinite)
            
            await page.setViewport({width: 1920, height: 1080, deviceScaleFactor: 1});

            await page.goto(clientUrl, pdfOpts);
            log('finished goto');
            // let pageContent = await page.content();
            
            if(queryString.transparent == 'true')
                await page.evaluate(() => document.body.style.background = 'transparent');

            // await sleep(2000);

            await page.waitForSelector(elementSelector);          // wait for the selector to load
            const element = await page.$(elementSelector);        // declare a variable with an ElementHandle
            const elmImg = await page.$('#imgGenerator > .row .col-lg-51'); 
            const elmText = await page.$('#imgGenerator > .row .col-lg-71'); 

            const box = await element.boundingBox();
            const elmImgBox  = await elmImg.boundingBox();
            const elmTextBox = await elmText.boundingBox();

            const textDirection = await page.$eval(elementSelector, e => e.style.direction);
            const isRtl = textDirection == 'rtl';

            const settings = {
                clip: {
                    width: elmImgBox.width + elmTextBox.width + 30,
                    height: elmImgBox.height + 10,
                    x: (isRtl ? elmTextBox.x : elmImgBox.x ) - 10,
                    y: (isRtl ? elmTextBox.y : elmImgBox.y ) -10
                },
                omitBackground: queryString.transparent == 'true'
            };

            let imageBuffer = await element.screenshot(settings);       // take screenshot element in puppeteer
           
            //  imageBuffer = await element.screenshot(); 
            // var fs = require('fs/promises')
            // await fs.writeFile("./biodivlogo.png", imageBuffer);

            // await page.setViewport({width: 800, height: 800, deviceScaleFactor: 3});
            
            return imageBuffer;
           
            
    } catch (err) {
        log(`error in processing request, ${JSON.stringify(err||{msg:'noerror'})}`)
        console.error('error catch', err);
        throw err;
    }
    finally{
        await page.close();            
    }

}


function abortNetworkUrlRequest(url){

    return /api\.cbddev\.xyz\/socket\.io/.test(url) ||
           /api\.cbd\.int\/socket\.io/.test(url) 
        //     ||
        //    /\app\/authorize\.html$/.test(url) || 
        //    /\/error-logs/.test(url)

}

function log(message){

    if(process.env.debug){
        console.log(new Date(), message, `${(((+new Date())-lastCall)/1000).toFixed(5)} secs`);
        lastCall = +new Date()
    }

}

module.exports = {
    renderUrlToImage
}
