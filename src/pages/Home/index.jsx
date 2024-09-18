import { useState, useEffect } from 'react'
import CodeEditor from '../../components/CodeEditor'
import Sidebar from '../../components/Sidebar'

// Custom Modal Component for Save Confirmation
const SaveModal = ({ fileName, onSave, onDiscard, onCancel }) => (
	<div
		style={{
			position: 'fixed',
			top: '50%',
			left: '50%',
			transform: 'translate(-50%, -50%)',
			backgroundColor: 'white',
			padding: '20px',
			border: '1px solid #ccc',
			zIndex: 1000,
		}}
	>
		<p>Do you want to save changes to {fileName} before closing?</p>
		<button onClick={onSave}>Save</button>
		<button onClick={onDiscard} style={{ marginLeft: '10px' }}>
			Discard
		</button>
		<button onClick={onCancel} style={{ marginLeft: '10px' }}>
			Cancel
		</button>
	</div>
)

const App = () => {
	const [openFiles, setOpenFiles] = useState([])
	const [activeTab, setActiveTab] = useState(0)
	const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)
	const [closingTabIndex, setClosingTabIndex] = useState(null)

	const handleFileSelect = async (fileHandle) => {
		const file = await fileHandle.getFile()
		const fileContent = await file.text()
		const fileName = file.name

		const existingFileIndex = openFiles.findIndex((f) => f.name === fileName)

		if (existingFileIndex !== -1) {
			setActiveTab(existingFileIndex)
		} else {
			setOpenFiles((prevFiles) => [
				...prevFiles,
				{
					name: fileName,
					content: fileContent,
					isSaved: true,
					handle: fileHandle,
				}, // Save file handle for future saving
			])
			setActiveTab(openFiles.length)
		}
	}

	const handleCodeChange = (newValue) => {
		const updatedFiles = [...openFiles]
		updatedFiles[activeTab].content = newValue
		updatedFiles[activeTab].isSaved = false // Mark file as unsaved
		setOpenFiles(updatedFiles)
	}

	// Save the file to the local system
	const handleSave = async () => {
		const file = openFiles[activeTab]
		const writable = await file.handle.createWritable() // Create a writable stream
		await writable.write(file.content) // Write the current file content to the disk
		await writable.close() // Close the writable stream

		const updatedFiles = [...openFiles]
		updatedFiles[activeTab].isSaved = true // Mark file as saved
		setOpenFiles(updatedFiles)
		console.log(`File "${updatedFiles[activeTab].name}" saved!`)
	}

	const confirmCloseTab = (index) => {
		if (!openFiles[index].isSaved) {
			// Show the custom save modal
			setClosingTabIndex(index)
			setIsSaveModalOpen(true)
		} else {
			handleCloseTab(index)
		}
	}

	const handleCloseTab = (index) => {
		const updatedFiles = openFiles.filter((_, i) => i !== index)
		setOpenFiles(updatedFiles)
		if (index === activeTab && updatedFiles.length > 0) {
			setActiveTab(Math.min(activeTab, updatedFiles.length - 1))
		} else if (updatedFiles.length === 0) {
			setActiveTab(0)
		}
		setIsSaveModalOpen(false) // Close the modal if it's open
	}

	const handleModalSave = () => {
		handleSave() // Save the file
		handleCloseTab(closingTabIndex) // Close the tab after saving
	}

	const handleModalDiscard = () => {
		handleCloseTab(closingTabIndex) // Close the tab without saving
	}

	const handleModalCancel = () => {
		setIsSaveModalOpen(false) // Close the modal and do nothing
	}

	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.ctrlKey && e.key === 's') {
				e.preventDefault()
				handleSave()
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [openFiles, activeTab])

	return (
		<div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
			<Sidebar onFileSelect={handleFileSelect} />
			<div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
				<div style={{ display: 'flex', borderBottom: '1px solid #ccc' }}>
					{openFiles.map((file, index) => (
						<div
							key={index}
							onClick={() => setActiveTab(index)}
							style={{
								padding: '10px',
								cursor: 'pointer',
								backgroundColor: activeTab === index ? '#ddd' : '#f5f5f5',
								borderBottom: activeTab === index ? '2px solid blue' : 'none',
								position: 'relative',
							}}
						>
							{file.name}
							{!file.isSaved && (
								<span
									style={{
										position: 'absolute',
										top: 5,
										right: 5,
										width: '10px',
										height: '10px',
										borderRadius: '50%',
										backgroundColor: 'white',
									}}
								/>
							)}
							<button
								onClick={(e) => {
									e.stopPropagation()
									confirmCloseTab(index)
								}}
								style={{ marginLeft: '10px', cursor: 'pointer' }}
							>
								✖
							</button>
						</div>
					))}
				</div>
				{openFiles.length > 0 && (
					<CodeEditor
						value={openFiles[activeTab].content}
						onChange={handleCodeChange}
					/>
				)}
			</div>

			{/* Render Save Modal if needed */}
			{isSaveModalOpen && (
				<SaveModal
					fileName={openFiles[closingTabIndex].name}
					onSave={handleModalSave}
					onDiscard={handleModalDiscard}
					onCancel={handleModalCancel}
				/>
			)}
		</div>
	)
}

export default App
