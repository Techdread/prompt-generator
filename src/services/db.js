class PromptsDB {
  constructor() {
    this.dbName = 'promptsDb'
    this.storeName = 'prompts'
    this.folderStoreName = 'folders'
    this.db = null
    this.init()
  }

  init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 2) // Increment version for schema update

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result
        
        // Create or update prompts store
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: '_id' })
          store.createIndex('timestamp', 'timestamp')
          store.createIndex('appType', 'appType')
          store.createIndex('provider', 'provider')
          store.createIndex('folderId', 'folderId')
        }

        // Create folders store
        if (!db.objectStoreNames.contains(this.folderStoreName)) {
          const folderStore = db.createObjectStore(this.folderStoreName, { keyPath: '_id' })
          folderStore.createIndex('name', 'name')
          folderStore.createIndex('timestamp', 'timestamp')
        }
      }
    })
  }

  async ensureInitialized() {
    if (!this.db) {
      await this.init()
    }
  }

  async savePrompt(promptData) {
    await this.ensureInitialized()
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const doc = {
        _id: new Date().toISOString(),
        timestamp: Date.now(),
        folderId: promptData.folderId || null,
        ...promptData
      }
      const request = store.add(doc)
      request.onsuccess = () => resolve(doc)
      request.onerror = () => reject(request.error)
    })
  }

  async getPrompts({ appType, provider, folderId } = {}) {
    await this.ensureInitialized()
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()

      request.onsuccess = () => {
        let prompts = request.result
        if (appType) {
          prompts = prompts.filter(p => p.appType === appType)
        }
        if (provider) {
          prompts = prompts.filter(p => p.provider === provider)
        }
        if (folderId !== undefined) {
          prompts = prompts.filter(p => p.folderId === folderId)
        }
        resolve(prompts.sort((a, b) => b.timestamp - a.timestamp))
      }
      request.onerror = () => reject(request.error)
    })
  }

  async createFolder(name) {
    await this.ensureInitialized()
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.folderStoreName], 'readwrite')
      const store = transaction.objectStore(this.folderStoreName)
      const folder = {
        _id: new Date().toISOString(),
        name,
        timestamp: Date.now()
      }
      const request = store.add(folder)
      request.onsuccess = () => resolve(folder)
      request.onerror = () => reject(request.error)
    })
  }

  async getFolders() {
    await this.ensureInitialized()
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.folderStoreName], 'readonly')
      const store = transaction.objectStore(this.folderStoreName)
      const request = store.getAll()
      request.onsuccess = () => {
        resolve(request.result.sort((a, b) => b.timestamp - a.timestamp))
      }
      request.onerror = () => reject(request.error)
    })
  }

  async movePromptToFolder(promptId, folderId) {
    await this.ensureInitialized()
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(promptId)
      
      request.onsuccess = () => {
        const prompt = request.result
        if (prompt) {
          prompt.folderId = folderId
          store.put(prompt)
          resolve(prompt)
        } else {
          reject(new Error('Prompt not found'))
        }
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
      (doc.appDescription?.toLowerCase() || '').includes(searchLower) ||
      (doc.generatedPrompt?.toLowerCase() || '').includes(searchLower)
    )
  }
}

export const promptsDb = new PromptsDB()
