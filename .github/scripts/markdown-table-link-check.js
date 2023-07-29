const fs = require("fs");
const linkCheck = require("link-check");
const LinkCheckResult = require("link-check").LinkCheckResult;
const readmeContent = fs.readFileSync("./README.md", "utf8");
const { parseMarkdownTables } = require("./helper/index.js");
const opt = require("./.link-check.json");
const { resolve } = require("dns");

const Status = {
    DEAD: "dead",
    ALIVE: "alive",
};

const symbolDead = "❌";
const symbolAlive = "✅";

const parsedTable = parseMarkdownTables(readmeContent);
const allLinksFromUrlsClm = parsedTable
    .map((table) => table.url)
    .flat()
    .filter(Boolean);

async function linksCheck(links) {
    const linkCheckResults = [];

    console.log(`Checking ${links.length} links...`);
    for (const link of links) {
        const res = await new Promise((resolve) =>
            linkCheck(link, opt, (_, result) => {
                console.log(
                    `${
                        result.status === Status.DEAD ? symbolDead : symbolAlive
                    } ${result.statusCode} <${result.link}>${
                        result.err !== null ? " ➨ " + result.err : ""
                    }`
                );
                return resolve(result);
            })
        );
        linkCheckResults.push(res);
    }
    return linkCheckResults;
}

async function checkLinksInTables() {
    const results = await linksCheck(allLinksFromUrlsClm);
    return results.reduce(
        (acc, cur) => {
            switch (cur.status) {
                case Status.DEAD:
                    acc.arrDead.push(cur.link);
                    break;
                case Status.ALIVE:
                    acc.arrAlive.push(cur.link);
                    break;
            }
            return acc;
        },
        { arrDead: [], arrAlive: [] }
    );
}

async function updateLinks(arrDead, arrAlive, lines) {
    const updatedLines = lines.map((line) => {
        arrDead.forEach((link) => {
            if (line.includes(link)) {
                line = line.replace(symbolAlive, symbolDead);
            }
        });
        arrAlive.forEach((link) => {
            if (line.includes(link)) {
                line = line.replace(symbolDead, symbolAlive);
            }
        });
        return line;
    });
    return updatedLines;
}

(async function () {
    const { arrAlive, arrDead } = await checkLinksInTables();

    if (arrDead.length > 0) {
        console.log(`${symbolDead} ${arrDead.length} link(s) are dead!`);
    }

    const lines = readmeContent.split("\n");
    const updatedLines = await updateLinks(arrDead, arrAlive, lines);
    console.log("Updating README.md...");
    const updatedTable = updatedLines.join("\n");
    fs.writeFileSync("./README.md", updatedTable, "utf8");

    console.log("Done!");
})();
