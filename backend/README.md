# Receipt Scanner API

API для сканирования и распознавания чеков. Поддерживает синхронную и асинхронную обработку изображений.

**Base URL:** `http://localhost:8000`

## Как запускать
```
python3.11 -m venv .venv # если нет нужно скачать python 3.11
. .venv/Scripts/activate # для windows
. .venv/bin/activate # для unix
pip install -r requirements.txt
python -m cv_pipeline.download_sroie
uvicorn backend.main:app --reload
```

---

## Эндпоинты

### `POST /scan_receipts` — Синхронное сканирование

Загружает один или несколько чеков и **сразу возвращает результат**. Подходит для небольшого количества файлов.

**Request**

```
Content-Type: multipart/form-data
```

| Поле    | Тип           | Описание                    |
|---------|---------------|-----------------------------|
| `files` | `File[]`      | Список изображений чеков    |


**Response `200 OK`**

```json
{
  "results": [
    {
      "doc_id": "uuid",
      "status": "ok",
      "full_text": "Магазин Лента\n12.04.2025\nИтого: 1500 тг",
      "fields": {
        "company": "Магазин Лента",
        "date": "12.04.2025",
        "total": "1500 тг",
        "address": "ул. Абая 10"
      },
      "metadata": {
        "method": "paddleocr",
        "duration_ms": 320
      }
    }
  ]
}
```

---

### `POST /scan_receipts_async` — Асинхронное сканирование

Загружает файлы и **сразу возвращает `job_id`** — обработка идёт в фоне. Используй для большого количества файлов.

**Request** — такой же, как у `/scan_receipts`.

**Response `200 OK`**

```json
{
  "job_id": "abc123",
  "status": "processing",
  "progress": 0.0
}
```

После получения `job_id` — периодически cпрашивай статус (см. следующий эндпоинт).

---

### `GET /jobs/{job_id}` — Статус задачи

Проверяет, готова ли задача.

**Response `200 OK`**

```json
{
  "job_id": "abc123",
  "status": "processing",   // или "done"
  "progress": 0.6           // от 0.0 до 1.0
}
```

| `status`      | Значение                        |
|---------------|---------------------------------|
| `processing`  | Ещё обрабатывается              |
| `done`        | Готово, можно забирать результат |

---

### `GET /jobs/{job_id}/results` — Результаты задачи

Возвращает результаты после того, как задача завершена (`status: "done"`).

**Response — успех:**

```json
{
  "results": [
    {
      "doc_id": "uuid",
      "status": "ok",
      "full_text": "...",
      "fields": {
        "company": "...",
        "date": "...",
        "total": "...",
        "address": "..."
      },
      "metadata": {
        "method": "ocr",
        "duration_ms": 410
      }
    }
  ]
}
```

**Response — задача ещё не готова:**

```json
{
  "error": "Job not finished"
}
```

## Когда использовать синхронный vs асинхронный режим?

| Ситуация                          | Рекомендация             |
|-----------------------------------|--------------------------|
| 1–3 файла, нужен быстрый ответ    | `POST /scan_receipts`    |
| Много файлов или долгая обработка | `POST /scan_receipts_async` |
