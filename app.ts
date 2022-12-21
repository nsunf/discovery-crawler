import puppeteer from "puppeteer";
import * as cheerio from "cheerio";

const new_men_url = "https://www.discovery-expedition.com/display/view?currentCtgryDpthCd=2&dspCtgryNo=DXMA01A01&ctgrySectCd=GNRL_CTGRY&ctgryNoDpth1=DXMA01&ctgryNoDpth2=DXMA01A01&prcStart=0&prcEnd=100&sortColumn=NEW_GOD_SEQ&pageSize=40&pageNo=";
const new_women_url = "https://www.discovery-expedition.com/display/view?currentCtgryDpthCd=2&dspCtgryNo=DXMA02A01&ctgrySectCd=GNRL_CTGRY&ctgryNoDpth1=DXMA02&ctgryNoDpth2=DXMA02A01&prcStart=0&prcEnd=100&sortColumn=NEW_GOD_SEQ&pageSize=120&pageNo=";

(async () => {
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  let $: cheerio.CheerioAPI;

  for (let i = 1; i < 2; i++) {
    await page.goto(new_men_url + i);


    const anchors = await page.$$("#contents > div.contents-type01-box02 > div.item-list02 > ul > li > a");
    let n = 0;
    while (anchors.length < n)
    for (let j = 0; j < anchors.length; j++) {
      await anchors[j].click();
      // $ = cheerio.load(await page.content());
      // const title = $("#contents > div.payment-container > div.payment-wrap > div.payment-state > div.payment-name").text().trim();
      // console.log("====> " + title);
      await page.goBack();
      if (j == 3) break;
    }
  }

  // browser.close();
 })();
