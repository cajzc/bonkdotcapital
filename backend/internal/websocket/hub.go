package websocket

import "log"

// Message represents a message sent to a room.
type Message struct {
	Room    string
	Content []byte
}

// Subscription represents a client's subscription to a room.
type Subscription struct {
	Client *Client
	Room   string
}

// Hub maintains the set of active clients and broadcasts messages to them.
type Hub struct {
	Rooms      map[string]map[*Client]bool
	Broadcast  chan Message
	Register   chan Subscription
	Unregister chan Subscription
}

func NewHub() *Hub {
	return &Hub{
		Rooms:      make(map[string]map[*Client]bool),
		Broadcast:  make(chan Message),
		Register:   make(chan Subscription),
		Unregister: make(chan Subscription),
	}
}

func (h *Hub) Run() {
	log.Println("WebSocket Hub is running...")
	for {
		select {
		case s := <-h.Register:
			clients := h.Rooms[s.Room]
			if clients == nil {
				clients = make(map[*Client]bool)
				h.Rooms[s.Room] = clients
			}
			h.Rooms[s.Room][s.Client] = true
			log.Printf("New client connected to room %s. Total clients in room: %d", s.Room, len(h.Rooms[s.Room]))

		case s := <-h.Unregister:
			clients := h.Rooms[s.Room]
			if clients != nil {
				if _, ok := clients[s.Client]; ok {
					delete(clients, s.Client)
					close(s.Client.Send)
					if len(clients) == 0 {
						delete(h.Rooms, s.Room)
					}
					log.Printf("Client disconnected from room %s. Total clients in room: %d", s.Room, len(h.Rooms[s.Room]))
				}
			}

		case message := <-h.Broadcast:
			clients := h.Rooms[message.Room]
			for client := range clients {
				select {
				case client.Send <- message.Content:
				default:
					close(client.Send)
					delete(clients, client)
				}
			}
		}
	}
}
