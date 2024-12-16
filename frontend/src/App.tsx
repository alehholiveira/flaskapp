import { useState } from 'react'

const Header = () => (
  <header className="bg-gradient-to-r from-green-400 to-blue-500 text-white py-4 shadow-lg">
    <h1 className="text-center text-3xl font-bold">Serviço de Processamento de Imagens</h1>
  </header>
)

const Footer = () => (
  <footer className="bg-gradient-to-r from-green-400 to-blue-500 text-white py-4 mt-8 shadow-lg">
    <p className="text-center">© 2024 Image Processor AiotLab</p>
  </footer>
)

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [username, setUsername] = useState<string>('')
  const [response, setResponse] = useState<{ processed_images: string[], ip: string, datetime: string } | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [showForm, setShowForm] = useState<boolean>(false)
  const [searchUsername, setSearchUsername] = useState<string>('')
  const [tempCode, setTempCode] = useState<string>('')
  const [sendTelegram, setSendTelegram] = useState<boolean>(false)
  const [userImages, setUserImages] = useState<UserImage[]>([])
  const [codeGenerated, setCodeGenerated] = useState<boolean>(false)
  const [modalImage, setModalImage] = useState<string | null>(null)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])

  interface UserImage {
    id: string
    ip: string
    datetime: string
    filename: string
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target
    setSelectedFilters((prev) =>
      checked ? [...prev, value] : prev.filter((filter) => filter !== value)
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData()
    if (file) {
      formData.append('image', file)
    }
    formData.append('username', sendTelegram ? username : '')
    formData.append('send_telegram', sendTelegram.toString())
    formData.append('filters', JSON.stringify(selectedFilters))

    const res = await fetch('http://localhost:5000/upload', {
      method: 'POST',
      body: formData,
    })
    const data = await res.json()
    setResponse(data)
    setLoading(false)
  }

  const handleFetchUserImages = async () => {
    const res = await fetch(`http://localhost:5000/user_images/${username}/${tempCode}`)
    const data = await res.json()
    if (data.error) {
      alert(data.error)
    } else {
      setSearchUsername(username)
      setUserImages(data)
    }
  }

  const handleGenerateCode = async () => {
    const res = await fetch(`http://localhost:5000/generate_code/${username}`)
    const data = await res.json()
    if (data.message) {
      alert(data.message)
      setCodeGenerated(true)
    } else {
      alert(data.error)
    }
  }

  const openModal = (image: string) => {
    setModalImage(`http://localhost:5000/image/processed/${image}`)
  }

  const closeModal = () => {
    setModalImage(null)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto bg-white p-8 rounded-lg shadow-lg">
        {!showForm ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Bem-vindo ao Serviço de Processamento de Imagens</h2>
            <p className="mb-4 text-gray-600">Para utilizar nosso serviço, siga o tutorial abaixo:</p>
            <ol className="list-decimal list-inside mb-6 text-left max-w-md mx-auto text-gray-700">
              <li>Abra o Telegram e escaneie o QR code abaixo para acessar o bot.</li>
              <li>Envie uma mensagem qualquer para o bot.</li>
              <li>Volte para esta página e insira seu nome de usuário do Telegram.</li>
            </ol>
            <img src="/images/qrcode.jpg" alt="QR Code do Bot" className="mx-auto mb-6 w-48 h-48 shadow-lg rounded-lg transition-transform transform hover:scale-110" />
            <button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-green-400 to-blue-500 text-white py-2 px-6 rounded-lg hover:from-green-500 hover:to-blue-600 transition">
              Seguir Adiante
            </button>
          </div>
        ) : (
          <div>
            <form onSubmit={handleSubmit} className="mb-4">
              <label className="block mb-2">
                <input type="checkbox" checked={sendTelegram} onChange={(e) => setSendTelegram(e.target.checked)} className="mr-2" />
                Enviar via Telegram
              </label>
              {sendTelegram && (
                <input type="text" placeholder="Nome de Usuário do Telegram" value={username} onChange={(e) => setUsername(e.target.value)} className="block w-full mb-2 p-2 border rounded" required />
              )}
              <input type="file" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" required />
              <div className="mt-4">
                <label className="block mb-2">
                  <input type="checkbox" value="cartoon" onChange={handleFilterChange} className="mr-2" />
                  Filtro Cartoon
                </label>
                <label className="block mb-2">
                  <input type="checkbox" value="gray" onChange={handleFilterChange} className="mr-2" />
                  Filtro Gray
                </label>
                <label className="block mb-2">
                  <input type="checkbox" value="blur" onChange={handleFilterChange} className="mr-2" />
                  Filtro Blur
                </label>
                <label className="block mb-2">
                  <input type="checkbox" value="faces" onChange={handleFilterChange} className="mr-2" />
                  Reconhecedor de Faces
                </label>
                <label className="block mb-2">
                  <input type="checkbox" value="classified" onChange={handleFilterChange} className="mr-2" />
                  Classificador de Imagens
                </label>
                <label className="block mb-2">
                  <input type="checkbox" value="sketch" onChange={handleFilterChange} className="mr-2" />
                  Processamento em Lápis
                </label>
              </div>
              <button type="submit" className="mt-4 w-full bg-gradient-to-r from-green-400 to-blue-500 text-white py-2 px-4 rounded hover:from-green-500 hover:to-blue-600 transition" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar'}
              </button>
            </form>
            {sendTelegram && (
              <button onClick={handleGenerateCode} className="mt-4 w-full bg-gradient-to-r from-blue-400 to-purple-500 text-white py-2 px-4 rounded hover:from-blue-500 hover:to-purple-600 transition">Gerar Código Temporário</button>
            )}
            {codeGenerated && (
              <><input type="text" placeholder="Código Temporário" value={tempCode} onChange={(e) => setTempCode(e.target.value)} className="block w-full mb-2 p-2 border rounded mt-4" required /><button onClick={handleFetchUserImages} className="mt-4 w-full bg-gradient-to-r from-blue-400 to-purple-500 text-white py-2 px-4 rounded hover:from-blue-500 hover:to-purple-600 transition">Buscar Imagens Processadas</button></>
            )}
            {userImages.length > 0 && (
              <div className="mt-4">
                <h2 className="text-xl font-bold mb-4">Imagens Processadas Anteriormente por @{searchUsername}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userImages.map((image) => (
                    <div key={image.id} className="border p-4 rounded-lg shadow-lg">
                      <img src={`http://localhost:5000/image/uploaded/${searchUsername}/${image.filename}`} alt="Imagem Processada" className="w-full h-auto mb-2" />
                      <p className="text-center text-gray-700">IP: {image.ip}</p>
                      <p className="text-center text-gray-700">Data/Hora: {image.datetime}</p>
                      <a href={`http://localhost:5000/image/processed/${searchUsername}/cartoon_${image.filename}`} download className="block text-center text-blue-500">cartoon</a>
                      <a href={`http://localhost:5000/image/processed/${searchUsername}/gray_${image.filename}`} download className="block text-center text-blue-500">gray</a>
                      <a href={`http://localhost:5000/image/processed/${searchUsername}/blur_${image.filename}`} download className="block text-center text-blue-500">Blur</a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {loading && (
          <div className="text-center mt-4">
            <div className="loader"></div>
            <p>Processando imagem, por favor aguarde...</p>
          </div>
        )}
        {response && response.processed_images && (
          <div className="image-preview mt-4">
            <div className="image-box border-2 border-dashed border-gray-300 w-72 h-48 flex items-center justify-center mb-4 mx-auto">
              <img src={URL.createObjectURL(file!)} alt="Imagem Original" className="max-w-full max-h-full" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {response.processed_images.map((image, index) => (
                <div key={index} className="border p-4 rounded-lg shadow-lg">
                  <img src={`http://localhost:5000/image/processed/${image}`} alt={`Imagem Processada ${index + 1}`} className="w-full h-auto mb-2 cursor-pointer" onClick={() => openModal(image)} />
                  <p className="text-center">Imagem Processada {index + 1}</p>
                  <a href={`http://localhost:5000/image/processed/${image}`} download className="block text-center text-blue-500">Baixar</a>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
      {modalImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative bg-white p-4 rounded-lg shadow-lg">
            <button onClick={closeModal} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img src={modalImage} alt="Imagem em Tamanho Grande" className="max-w-full max-h-full" />
          </div>
        </div>
      )}
    </div>
  )
}

export default App