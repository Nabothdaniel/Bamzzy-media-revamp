 const messages = (req, res) => {
  const messages = readDataFile(MESSAGES_FILE)
  const users = readDataFile(USERS_FILE)

  // Get user's conversations (either as sender or receiver)
  const userMessages = messages.filter((msg) => msg.senderId === req.user.id || msg.receiverId === req.user.id)

  // Get unique conversation partners
  const conversationPartners = new Set()
  userMessages.forEach((msg) => {
    if (msg.senderId === req.user.id) {
      conversationPartners.add(msg.receiverId)
    } else {
      conversationPartners.add(msg.senderId)
    }
  })

  // Format conversations
  const conversations = Array.from(conversationPartners).map((partnerId) => {
    const partner = users.find((user) => user.id === partnerId)
    const conversation = userMessages
      .filter(
        (msg) =>
          (msg.senderId === req.user.id && msg.receiverId === partnerId) ||
          (msg.senderId === partnerId && msg.receiverId === req.user.id),
      )
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

    const unreadCount = conversation.filter((msg) => msg.receiverId === req.user.id && !msg.read).length

    return {
      partnerId,
      partnerName: partner ? partner.name : "Unknown",
      partnerRole: partner ? partner.role : "unknown",
      lastMessage: conversation[conversation.length - 1],
      unreadCount,
    }
  })

  return res.json({
    success: true,
    conversations,
  })
}

const getMessageById = (req, res) => {
  const { partnerId } = req.params
  const messages = readDataFile(MESSAGES_FILE)

  // Get conversation with partner
  const conversation = messages
    .filter(
      (msg) =>
        (msg.senderId === req.user.id && msg.receiverId === partnerId) ||
        (msg.senderId === partnerId && msg.receiverId === req.user.id),
    )
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

  // Mark messages as read
  let updated = false
  messages.forEach((msg) => {
    if (msg.receiverId === req.user.id && msg.senderId === partnerId && !msg.read) {
      msg.read = true
      updated = true
    }
  })

  if (updated) {
    writeDataFile(MESSAGES_FILE, messages)
  }

  return res.json({
    success: true,
    messages: conversation,
  })
}

const autoReplyMessage =  (req, res) => {
  const { receiverId, message } = req.body

  if (!receiverId || !message) {
    return res.status(400).json({ success: false, message: "Missing required fields" })
  }

  const messages = readDataFile(MESSAGES_FILE)
  const users = readDataFile(USERS_FILE)

  // Verify receiver exists
  const receiver = users.find((user) => user.id === receiverId)
  if (!receiver) {
    return res.status(404).json({ success: false, message: "Receiver not found" })
  }

  // Create new message
  const newMessage = {
    id: Date.now().toString(),
    senderId: req.user.id,
    receiverId,
    message,
    timestamp: new Date().toISOString(),
    read: false,
  }

  messages.push(newMessage)

  // Check if this is a funding request message and receiver is admin
  let autoReply = null
  if (
    receiverId === "1" && // Admin ID
    req.user.role === "user" &&
    message.toLowerCase().includes("fund") &&
    message.toLowerCase().includes("account")
  ) {
    // Create auto-reply message for funding requests
    autoReply = {
      id: Date.now().toString() + "-reply",
      senderId: "1", // Admin ID
      receiverId: req.user.id,
      message:
        "Please send exact amount to this account: 7087182921 Opay Babalola Ayomide. Type 'done' after payment has been made.",
      timestamp: new Date().toISOString(),
      read: false,
    }

    messages.push(autoReply)
  } else if (
    receiverId === "1" && // Admin ID
    req.user.role === "user" &&
    message.toLowerCase() === "done"
  ) {
    // Create auto-reply for "done" message
    autoReply = {
      id: Date.now().toString() + "-reply",
      senderId: "1", // Admin ID
      receiverId: req.user.id,
      message:
        "Please wait, we are connecting you to a nearest admin live chat where funding your account would take place...",
      timestamp: new Date().toISOString(),
      read: false,
    }

    messages.push(autoReply)
  }

  if (writeDataFile(MESSAGES_FILE, messages)) {
    const response = {
      success: true,
      message: "Message sent successfully",
      data: newMessage,
    }

    if (autoReply) {
      response.autoReply = autoReply
    }

    return res.json(response)
  } else {
    return res.status(500).json({ success: false, message: "Failed to send message" })
  }
}

export {messages,getMessageById,autoReplyMessage};