import { useState } from 'react'

const Header = () => (
  <header className="bg-green-500 text-white py-4">
    <h1 className="text-center text-2xl font-bold">Serviço de Processamento de Imagens</h1>
  </header>
)

const Footer = () => (
  <footer className="bg-green-500 text-white py-4 mt-8">
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

  interface UserImage {
    id: string
    ip: string
    datetime: string
    filename: string
  }

  const [userImages, setUserImages] = useState<UserImage[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
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
    } else {
      alert(data.error)
    }
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
            <img src="/images/qrcode.jpg" alt="QR Code do Bot" className="mx-auto mb-6 w-48 h-48 shadow-lg rounded-lg" />
            <button onClick={() => setShowForm(true)} className="bg-green-500 text-white py-2 px-6 rounded-lg hover:bg-green-600 transition">
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
              <button type="submit" className="mt-4 w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar'}
              </button>
            </form>
            <button onClick={handleGenerateCode} className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">Gerar Código Temporário</button>
            <input type="text" placeholder="Código Temporário" value={tempCode} onChange={(e) => setTempCode(e.target.value)} className="block w-full mb-2 p-2 border rounded" required />
            <button onClick={handleFetchUserImages} className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">Buscar Imagens Processadas</button>
            {userImages.length > 0 && (
              <div className="mt-4">
                <h2 className="text-xl font-bold mb-4">Imagens Processadas Anteriormente</h2>
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border-b-2 border-gray-300 py-2 px-4 bg-green-500 text-white">IP</th>
                      <th className="border-b-2 border-gray-300 py-2 px-4 bg-green-500 text-white">Data/Hora</th>
                      <th className="border-b-2 border-gray-300 py-2 px-4 bg-green-500 text-white">Imagem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userImages.map((image) => (
                      <tr key={image.id}>
                        <td className="border-b border-gray-300 py-2 px-4">{image.ip}</td>
                        <td className="border-b border-gray-300 py-2 px-4">{image.datetime}</td>
                        <td className="border-b border-gray-300 py-2 px-4"><img src={`http://localhost:5000/image/uploaded/${searchUsername}/${image.filename}`} alt="Imagem Processada" className="w-24 h-auto" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
          <div className="image-preview flex justify-around mt-4">
            <div className="image-box border-2 border-dashed border-gray-300 w-72 h-48 flex items-center justify-center mr-4">
              <img src={URL.createObjectURL(file!)} alt="Imagem Original" className="max-w-full max-h-full" />
            </div>
            <div className="image-box-response border-2 border-dashed border-gray-300 w-96 h-96 flex items-center justify-center overflow-hidden">
              {response.processed_images.map((image, index) => (
                <div key={index} className="border p-4 rounded-lg">
                  <img src={`http://localhost:5000/image/processed/${image}`} alt={`Imagem Processada ${index + 1}`} className="w-full h-auto mb-2" />
                  <p className="text-center">Imagem Processada {index + 1}</p>
                  <a href={`http://localhost:5000/image/processed/${image}`} download className="block text-center text-blue-500">Baixar</a>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

export default App