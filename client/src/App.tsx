import { useState, useEffect, useCallback } from 'react'
import { fetchItems, fetchState, updateState } from './api'
import type { Item } from './api'
import { VirtualizedList } from './components/VirtualizedList'
import './App.css'

function App() {
  const [items, setItems] = useState<Item[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const handleSelectionChange = useCallback((itemId: number, isSelected: boolean) => {
    const newSelectedIds = new Set(selectedIds)
    if (isSelected) {
      newSelectedIds.add(itemId)
    } else {
      newSelectedIds.delete(itemId)
    }
    setSelectedIds(newSelectedIds)
    updateState({ selected: Array.from(newSelectedIds) })
  }, [selectedIds])

  const moveItem = useCallback((dragIndex: number, hoverIndex: number) => {
    setItems((prevItems) => {
        const newItems = [...prevItems];
        const [draggedItem] = newItems.splice(dragIndex, 1);
        newItems.splice(hoverIndex, 0, draggedItem);
        
        // Persist the new sort order of all currently loaded items
        const sortedIds = newItems.map(i => i.id);
        updateState({ sorted: sortedIds });

        return newItems;
    });
  }, []);

  // Effect for debouncing search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
    }, 500)

    return () => {
      clearTimeout(handler)
    }
  }, [search])

  // Combined effect for fetching initial items based on search or initial load
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true)
      setItems([])
      try {
        if (debouncedSearch) {
          // Fetch based on search term
          const { items: newItems, total: newTotal } = await fetchItems(0, 40, debouncedSearch)
          setItems(newItems)
          setTotal(newTotal)
        } else {
          // Initial load from server state
          const { items: initialItems, total: initialTotal, selectedIds: serverSelectedIds } = await fetchState()
          setItems(initialItems)
          setTotal(initialTotal)
          setSelectedIds(new Set(serverSelectedIds))
        }
      } catch (error) {
        console.error('Failed to fetch initial data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [debouncedSearch])

  const loadMoreItems = useCallback(async () => {
    if (loading || items.length >= total) {
      return
    }
    setLoading(true)
    try {
      const { items: newItems } = await fetchItems(items.length, 20, debouncedSearch)
      setItems(prevItems => [...prevItems, ...newItems])
    } catch (error) {
      console.error('Failed to fetch more items:', error)
    } finally {
      setLoading(false)
    }
  }, [loading, items, total, debouncedSearch])

  return (
    <>
      <div className="header">
        <h1>Интерактивный список</h1>
      </div>
      <div className="search-container">
        <input
          type="text"
          placeholder="Поиск..."
          className="search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="list-container">
        <VirtualizedList
          items={items}
          total={total}
          loading={loading}
          loadMoreItems={loadMoreItems}
          selectedIds={selectedIds}
          onSelectionChange={handleSelectionChange}
          moveItem={moveItem}
        />
      </div>
    </>
  )
}

export default App
