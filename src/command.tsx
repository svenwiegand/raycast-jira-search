import {ActionPanel, CopyToClipboardAction, List, ListItemProps, OpenInBrowserAction} from "@raycast/api"
import {useEffect, useState} from "react"

export type ResultItem = ListItemProps & { url: string }
type SearchFunction = (query: string) => Promise<ResultItem[]>

export function SearchCommand(search: SearchFunction) {
    const [query, setQuery] = useState("")
    const [items, setItems] = useState<ResultItem[]>([])
    useEffect(() => {
        setIsLoading(true)
        search(query).then(resultItems => {
            setItems(resultItems)
            setIsLoading(false)
        })
    }, [query])
    const [isLoading, setIsLoading] = useState(false)

    const onSearchChange = (newSearch: string) => setQuery(newSearch)
    const buildItem = (item: ResultItem) => (
        <List.Item
            key={item.id}
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
            isLoading={isLoading}
        >
            {items.map(buildItem)}
        </List>
    );
}
