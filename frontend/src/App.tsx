import { useState } from 'react'

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [username, setUsername] = useState<string>('')
  const [response, setResponse] = useState<{ image_proc: string, ip: string, datetime: string } | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [showForm, setShowForm] = useState<boolean>(false)

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
    formData.append('username', username)

    const res = await fetch('http://localhost:5000/upload', {
      method: 'POST',
      body: formData,
    })
    const data = await res.json()
    setResponse(data)
    setLoading(false)
  }

  return (
    <div className="container mx-auto bg-white p-8 rounded-lg shadow-lg">
      {!showForm ? (
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Bem-vindo ao Serviço de Processamento de Imagens</h1>
          <p className="mb-4">Para utilizar nosso serviço, você precisa enviar uma mensagem para o nosso bot no Telegram. Siga o tutorial abaixo:</p>
          <ol className="list-decimal list-inside mb-4 text-center">
            <li>Abra o Telegram e escaneie o QR code abaixo para acessar o bot.</li>
            <li>Envie uma mensagem qualquer para o bot.</li>
            <li>Volte para esta página e insira seu nome de usuário do Telegram.</li>
          </ol>
          <img src="/images/qrcode.jpg" alt="QR Code do Bot" className="mx-auto mb-4" />
          <button onClick={() => setShowForm(true)} className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600">Seguir Adiante</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mb-4">
          <input type="text" placeholder="Nome de Usuário do Telegram" value={username} onChange={(e) => setUsername(e.target.value)} className="block w-full mb-2 p-2 border rounded" required />
          <input type="file" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" required />
          <button type="submit" className="mt-4 w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar'}
          </button>
        </form>
      )}
      {loading && (
        <div className="text-center mt-4">
          <div className="loader"></div>
          <p>Processando imagem, por favor aguarde...</p>
        </div>
      )}
      {response && (
        <div className="image-preview flex justify-around mt-4">
          <div className="image-box border-2 border-dashed border-gray-300 w-72 h-48 flex items-center justify-center mr-4">
            <img src={URL.createObjectURL(file!)} alt="Imagem Original" className="max-w-full max-h-full" />
          </div>
          <div className="image-box-response border-2 border-dashed border-gray-300 w-96 h-96 flex items-center justify-center overflow-hidden">
            <img src={`http://localhost:5000/image/${response.image_proc}`} alt="Imagem Processada" className="max-w-full max-h-full object-contain" />
          </div>
        </div>
      )}
      {response && (
        <table className="w-full border-collapse mt-4">
          <thead>
            <tr>
              <th className="border-b-2 border-gray-300 py-2 px-4 bg-green-500 text-white">IP</th>
              <th className="border-b-2 border-gray-300 py-2 px-4 bg-green-500 text-white">Data/Hora</th>
              <th className="border-b-2 border-gray-300 py-2 px-4 bg-green-500 text-white">Imagem</th>
              <th className="border-b-2 border-gray-300 py-2 px-4 bg-green-500 text-white">Imagem Processada</th>
              <th className="border-b-2 border-gray-300 py-2 px-4 bg-green-500 text-white">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-b border-gray-300 py-2 px-4">{response.ip}</td>
              <td className="border-b border-gray-300 py-2 px-4">{response.datetime}</td>
              <td className="border-b border-gray-300 py-2 px-4"><img src={URL.createObjectURL(file!)} alt="Imagem Original" className="w-24 h-auto" /></td>
              <td className="border-b border-gray-300 py-2 px-4"><img src={`http://localhost:5000/image/${response.image_proc}`} alt="Imagem Processada" className="w-24 h-auto" /></td>
              <td className="border-b border-gray-300 py-2 px-4"><button className="text-red-500">🗑️</button></td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  )
}

export default App