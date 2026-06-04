// server/sockets/delivery.js
const Order = require('../models/Order');
const jwt   = require('jsonwebtoken');

module.exports = function registerDeliverySocket(io) {

  io.on('connection', (socket) => {

    // ✅ Rejoindre la room de la commande
    socket.on('join_order', async ({ orderId, token }) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const order   = await Order.findById(orderId);

        if (!order) return socket.emit('error', { message: 'Commande introuvable' });

        const isClient = order.clientId?.toString() === decoded.userId;
        const isDriver = order.driverId?.toString() === decoded.userId;

        if (!isClient && !isDriver) {
          return socket.emit('error', { message: 'Accès refusé' });
        }

        socket.join(`order:${orderId}`);
        console.log(`✅ Socket ${socket.id} → room order:${orderId}`);

      } catch (err) {
        socket.emit('error', { message: 'Token invalide' });
      }
    });

    // ✅ Livreur envoie sa position GPS
    socket.on('location_update', async ({ orderId, lat, lng }) => {
      try {
        // Sauvegarder dans MongoDB
        await Order.findByIdAndUpdate(orderId, {
          'delivery.coords':    { lat, lng },
          'delivery.updatedAt': new Date(),
        });

        // Diffuser uniquement aux membres de cette room
        io.to(`order:${orderId}`).emit('location_update', { lat, lng });

      } catch (err) {
        console.error('Erreur location_update:', err);
      }
    });

    // ✅ Livreur met à jour le statut
    socket.on('update_status', async ({ orderId, status }) => {
      try {
        await Order.findByIdAndUpdate(orderId, { status });

        io.to(`order:${orderId}`).emit('order_status', { status });

        console.log(`📦 Commande ${orderId} → ${status}`);

      } catch (err) {
        console.error('Erreur update_status:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket ${socket.id} déconnecté`);
    });
  });
};