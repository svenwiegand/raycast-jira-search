import {ActionPanel, CopyToClipboardAction, List, ListItemProps, OpenInBrowserAction} from "@raycast/api"
import {useEffect, useState} from "react"

export type ResultItem = ListItemProps & { url: string }
type SearchFunction = (query: string) => Promise<ResultItem[]>

export function SearchCommand(search: SearchFunction) {
    const [query, setQuery] = useState<string>("")
    const [items, setItems] = useState<ResultItem[]>([])
    useEffect(() => {
        search(query).then(resultItems => setItems(resultItems))
    }, [query])

    const onSearchChange = (newSearch: string) => setQuery(newSearch)
    const buildItem = (item: ResultItem) => (
        <List.Item
            {...item}
            actions={
                <ActionPanel>
                    <ActionPanel.Section title="URL">
                        <OpenInBrowserAction url={item.url}/>
                        <CopyToClipboardAction content={item.url} title="Copy URL"/>
                    </ActionPanel.Section>
                    <ActionPanel.Section title="Link">
                        <CopyToClipboardAction content={`[${item.title}](${item.url})`} title="Copy Markdown Link"/>
                        <CopyToClipboardAction content={`<a href="${item.url}">${item.title}</a>`} title="Copy HTML Link"/>
                    </ActionPanel.Section>
                </ActionPanel>
            }
        />
    )

    return (
        <List
            throttle
            onSearchTextChange={onSearchChange}
        >
            {items.map(buildItem)}
        </List>
    );
}
