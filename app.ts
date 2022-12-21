import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import * as fs from "fs";

const pageSize: 40|80|120 = 40;
const numOfPages = 1;

const url = "https://www.discovery-expedition.com/";
const new_men_url = url + "display/view?currentCtgryDpthCd=2&dspCtgryNo=DXMA01A01&ctgrySectCd=GNRL_CTGRY&ctgryNoDpth1=DXMA01&ctgryNoDpth2=DXMA01A01&prcStart=0&prcEnd=100&sortColumn=NEW_GOD_SEQ";
const new_women_url = url + "display/view?currentCtgryDpthCd=2&dspCtgryNo=DXMA02A01&ctgrySectCd=GNRL_CTGRY&ctgryNoDpth1=DXMA02&ctgryNoDpth2=DXMA02A01&prcStart=0&prcEnd=100&sortColumn=NEW_GOD_SEQ";

interface Product {
  id: String;
  name: String;
  price: number;
  sizes: number[];
  images: string[];
  descriptions: string[];
  longImages: string[];
}

(async () => {
  const products: Product[] = [];

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  let $: cheerio.CheerioAPI;

  for (let p = 1; p <= numOfPages; p++) {
    await page.goto(new_men_url + `&pageSize=${pageSize}&pageNo=${p}`);

    $ = cheerio.load(await page.content());

    const pathList: string[] = [];

    $("#contents > div.contents-type01-box02 > div.item-list02 > ul > li > a").each((idx, el) => {
      const onclickStr = $(el).attr("onclick") ?? "";
      let startIdx = "gaTagging('".length;
      let endIdx = onclickStr.indexOf("','");

      const path = onclickStr.slice(startIdx, endIdx);
      pathList.push(path);
    })

    for (let i = 0; i < pathList.length; i++) {
      await page.goto(url + pathList[i]);
      $ = cheerio.load(await page.content());
      const p_name = $(".payment-name").text().trim();
      const p_price = $(".payment-price .price .txt-price em").text().trim();
      const p_code = $(".dl-dfn .dl-txt").text().trim();
      const p_sizes = $(".payment-option-size > button").map((_, el) => $(el).text().trim()).toArray();
      const p_imgs = $("div.slide-container > ul.slide-wrapper li.pic > a.item > img").map((_, el) => $(el).attr("src")).toArray();
      const p_desc = $("div.product-img-wrap div.product-img-info > ul > ul > li").map((_, el) => $(el).text().trim()).toArray();
      const p_longImgs = $("div.product-img-wrap div.product-img-info > ul > div > img").map((_, el) => $(el).attr("src")).toArray();

      // console.log("name : " + p_name);
      // console.log("price : " + p_price);
      // console.log("code : " + p_code);
      // console.log("size : " + p_sizes);

      // console.log("imgs :");
      // for (let img of p_imgs) {
      //   console.log("\t" + img);
      // }

      // console.log("des :");
      // for (let des of p_desc) {
      //   console.log("\t" + des);
      // }

      // console.log("long imgs :");
      // for (let longImg of p_longImgs) {
      //   console.log("\t" + longImg);
      // }

      products.push({
        id: p_code,
        name: p_name,
        price: parseInt(p_price.replace(",", "")),
        sizes: p_sizes.map(v => parseInt(v)),
        images: p_imgs,
        descriptions: p_desc, 
        longImages: p_longImgs
      })
      console.log(`progress : (${i + 1} / ${numOfPages * pageSize})`);
    }
  }

  fs.writeFileSync("./data/products.json", JSON.stringify(products, null, 2));
  console.log(products.length + " files saved");

  browser.close();
 })();
