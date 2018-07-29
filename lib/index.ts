import yargs = require("yargs");
import {default as camel} from "camelcase";
import { readFile } from "fs";
import { promisify } from "util";
import { renderFile, render } from "ejs";
import { writeFile } from "fs-extra";
import chalk from "chalk";

const argv = yargs.argv;

export interface ProcessFileOptions {
    data: any;
    defaultData: any;
    outputFile: string | ((inputFile: string) => string);
    onData: (data: any) => void;
}

function makeData(defaultData: any, suppliedData: any): any {
    const data: any = {
        env: {
            ...process.env,
        },
        arvg: {
            ...argv,
        },
    };
    if(defaultData) {
        for(const key in defaultData) {
            data[camel(key)] = defaultData[key];
        }
    }
    for(const key in data.env) {
        data[camel(key)] = data.env[key];
    }
    for(const key in data.arvg) {
        if(key === "_" || key === "$0") {
            continue;
        }
        data[camel(key)] = data.arvg[key];
    }
    if(suppliedData) {
        for(const key in suppliedData) {
            data[camel(key)] = suppliedData[key];
        }
    }
    return data;
}
const writeFileAsync: (fn: string, data: any) => Promise<any> = promisify(writeFile);
const readFileAsync: (fn: string) => Promise<any> = promisify(readFile);

export async function processTarget(target: string | string[], processOptions?: Partial<ProcessFileOptions>) {
    const options: ProcessFileOptions = Object.assign({}, processOptions, {
        outputFile: (inputFile) => {
            if(!inputFile.endsWith(".ejs")) {
                return inputFile;
            }
            return inputFile.substring(0, inputFile.length-4);
        },
        onData: (data: any) => {
            // Do nothing
        },
    } as ProcessFileOptions);
    if(typeof options.outputFile === "string") {
        const constantOutputFile = options.outputFile;
        options.outputFile = () => constantOutputFile;
    }
    options.data = makeData(options.defaultData, options.data);
    options.onData(options.data);
    const data: any = new Proxy<any>(options.data, {
        get(target: object, propertyKey: PropertyKey, receiver?: any) {
            let value: any = (target as any)[propertyKey];
            if(typeof value !== "undefined") {
                return value;
            }
            value = (target as any)[camel(propertyKey.toString())];
            if(typeof value !== "undefined") {
                return value;
            }
            return propertyKey;
        },
        has: (target: object, propertyKey: PropertyKey) => {
            if(propertyKey !== "escapeFn" && propertyKey !== "__append") {
                return true;
            }
            return typeof (target as any)[propertyKey] !== "undefined"
        }
    });
    for(const template of (typeof target === "string" ? [target] : target)) {
        try {
            const startTime = new Date().valueOf();
            const templateData: string = (await readFileAsync(template)).toString("utf8");
            const renderedTemplate: string = await render(templateData, data, {
                async: true,
            });
            await writeFileAsync(options.outputFile(template), renderedTemplate);
            console.log(chalk`{green Processed: }{bold ${template}} ${(new Date().valueOf() - startTime).toString()} in ms`);
        } catch(err) {
            console.log(chalk`{red Error: }{bold ${template}} ${err}`);
        }
    }
}

processTarget(argv._);
