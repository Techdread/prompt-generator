class PromptsDB {
  constructor() {
    this.dbName = 'promptsDb'
    this.storeName = 'prompts'
    this.db = null
    this.init()
  }

  init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result
        const store = db.createObjectStore(this.storeName, { keyPath: '_id' })
        store.createIndex('timestamp', 'timestamp')
        store.createIndex('appType', 'appType')
        store.createIndex('provider', 'provider')
      }
    })
  }

  async savePrompt(promptData) {
    await this.ensureInitialized()
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const doc = {
        _id: new Date().toISOString(),
        timestamp: Date.now(),
        ...promptData
      }
      const request = store.add(doc)
      request.onsuccess = () => resolve(doc)
      request.onerror = () => reject(request.error)
    })
  }

  async getPrompts({ appType, provider } = {}) {
    await this.ensureInitialized()
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()

      request.onsuccess = () => {
        let results = request.result
        if (appType) {
          results = results.filter(doc => doc.appType === appType)
        }
        if (provider) {
          results = results.filter(doc => doc.provider === provider)
        }
        resolve(results.sort((a, b) => b.timestamp - a.timestamp))
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getPrompt(id) {
    await this.ensureInitialized()
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async deletePrompt(id) {
    await this.ensureInitialized()
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async exportPrompts() {
    const prompts = await this.getPrompts()
    return prompts
  }

  async searchPrompts(searchText) {
    const prompts = await this.getPrompts()
    const searchLower = searchText.toLowerCase()
    return prompts.filter(doc => 
      doc.appDescription.toLowerCase().includes(searchLower) ||
      doc.generatedPrompt.toLowerCase().includes(searchLower)
    )
  }

  async ensureInitialized() {
    if (!this.db) {
      await this.init()
    }
  }
}

export const promptsDb = new PromptsDB()
