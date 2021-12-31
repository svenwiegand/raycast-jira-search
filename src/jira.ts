import {getPreferenceValues} from "@raycast/api"
import fetch from "node-fetch"

const prefs: { domain: string, user: string, token: string } = getPreferenceValues()
const headers = {
    "Accept": "application/json",
    "Authorization": "Basic " + Buffer.from(`${prefs.user}:${prefs.token}`).toString('base64')
}
const init = {
    headers
}

export async function jiraFetch<Result>(path: string, params: { [key: string]: string }): Promise<Result> {
    const paramKeys = Object.keys(params)
    const query = paramKeys.map(key => `${key}=${encodeURI(params[key])}`).join('&')
    const response = await fetch(`https://${prefs.domain}/${path}?${query}`, init)
    return response.json() as unknown as Result
}