const net = require('net');

const server = new net.Server();
const client = new net.Socket();

function init() {
    // Set up server to echo received data
    server.on('connection', (socket) => {
        console.log('Client connected');
        socket.on('data', (data) => {
            console.log('Server received:', data.toString());
        });
        
        socket.on('close', () => {
            console.log('Client disconnected');
        });
    });

    server.listen({ port: 0, host: '127.0.0.1', reuseAddress: true }, async () => {
        const port = server.address()?.port;
        if (!port) throw new Error('Server port not found');
        
        console.log(`Server listening on port ${port}`);
        
        client.connect(
            {
                port: port,
                host: '127.0.0.1',
                localAddress: '127.0.0.1',
                reuseAddress: true,
            },
            async () => {
                console.log('Client connected to server');
                
                // Start polling write - send "ping" every 1000ms (1 second)
                try {
                    const intervalId = await client.startPollingWrite(1000, 'ping\n', 'utf8');
                    console.log(`Started polling write with interval ID: ${intervalId}`);
                    
                    // Stop polling after 5 seconds
                    setTimeout(async () => {
                        console.log('Stopping polling write...');
                        const stopped = await client.stopPollingWrite(intervalId);
                        console.log(`Polling write stopped: ${stopped}`);
                        
                        // Close connection after stopping
                        setTimeout(() => {
                            client.destroy();
                            server.close();
                        }, 1000);
                    }, 5000);
                    
                } catch (error) {
                    console.error('Error with polling write:', error);
                }
            }
        );
    });

    client.on('error', (error) => {
        console.error('Client error:', error);
    });

    server.on('error', (error) => {
        console.error('Server error:', error);
    });
}

function server() {
    // Server only mode for testing
    const serverSocket = new net.Server();
    serverSocket.on('connection', (socket) => {
        console.log('Client connected');
        socket.on('data', (data) => {
            console.log('Server received:', data.toString());
        });
    });
    
    serverSocket.listen({ port: 8080, host: '127.0.0.1', reuseAddress: true }, () => {
        console.log('Server listening on port 8080');
    });
}

function client() {
    // Client only mode for testing
    const clientSocket = new net.Socket();
    clientSocket.connect(
        {
            port: 8080,
            host: '127.0.0.1',
            reuseAddress: true,
        },
        async () => {
            console.log('Connected to server');
            
            try {
                // Start polling write with heartbeat every 2 seconds
                const intervalId = await clientSocket.startPollingWrite(2000, 'heartbeat\n', 'utf8');
                console.log(`Started heartbeat with interval ID: ${intervalId}`);
                
                // Stop after 10 seconds
                setTimeout(async () => {
                    const stopped = await clientSocket.stopPollingWrite(intervalId);
                    console.log(`Heartbeat stopped: ${stopped}`);
                    clientSocket.destroy();
                }, 10000);
                
            } catch (error) {
                console.error('Error:', error);
            }
        }
    );
}

module.exports = { init, server, client }; 