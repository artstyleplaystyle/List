const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const apiRouter = express.Router();

app.use(cors());
app.use(express.json());

// --- In-memory data store ---
const largeList = Array.from({ length: 1000000 }, (_, i) => ({
  id: i + 1,
  text: `Элемент ${i + 1}`,
}));

let sortedIds = largeList.map(item => item.id);
let selectedIds = new Set();

// --- API Endpoints ---
apiRouter.get('/state', (req, res) => {
  const paginatedIds = sortedIds.slice(0, 20);
  const items = paginatedIds.map(id => {
    const item = largeList.find(i => i.id === id);
    return {
      ...item,
      isSelected: selectedIds.has(id),
    };
  });

  res.json({
    items,
    total: largeList.length,
    selectedIds: Array.from(selectedIds),
  });
});

apiRouter.post('/state', (req, res) => {
    const { sorted, selected } = req.body;
    if (sorted) {
        const updatedSortedIds = sorted.map(Number);
        const restOfIds = sortedIds.filter(id => !updatedSortedIds.includes(id));
        sortedIds = [...updatedSortedIds, ...restOfIds];
    }
    if (selected) {
        selectedIds = new Set(selected.map(Number));
    }
    res.status(200).json({ message: 'Состояние обновлено' });
});

apiRouter.get('/items', (req, res) => {
  const { offset = 0, limit = 20, search = '' } = req.query;
  const numOffset = parseInt(offset, 10);
  const numLimit = parseInt(limit, 10);

  const filteredItems = search
    ? largeList.filter(item => item.text.toLowerCase().includes(search.toLowerCase()))
    : largeList;

  const filteredIds = new Set(filteredItems.map(item => item.id));
  const displayIds = sortedIds.filter(id => filteredIds.has(id));
  const paginatedIds = displayIds.slice(numOffset, numOffset + numLimit);
  const items = paginatedIds.map(id => {
    const item = largeList.find(i => i.id === id);
    return {
      ...item,
      isSelected: selectedIds.has(id),
    };
  });

  res.json({
    items,
    total: displayIds.length,
  });
});

// --- Server Setup ---
// API routes
app.use('/api', apiRouter);

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});

module.exports = app; 