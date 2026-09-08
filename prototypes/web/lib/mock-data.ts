// Mock data para AçaíConecta - Protótipo

export type Store = {
  id: string
  name: string
  owner: string
  address: string
  distance: number
  rating: number
  reviews: number
  isOpen: boolean
  image: string
  status: 'open' | 'closed' | 'busy'
  queueSize: number
}

export type Product = {
  id: string
  name: string
  description: string
  price: number
  image: string
  storeId: string
}

export type OrderItem = {
  productId: string
  quantity: number
  customizations: string[]
}

export type Order = {
  id: string
  customerId: string
  storeId: string
  items: OrderItem[]
  total: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  createdAt: Date
  estimatedTime: number
}

export type Notification = {
  id: string
  type: 'order_confirmed' | 'order_ready' | 'order_delivered' | 'promotion'
  message: string
  timestamp: Date
  read: boolean
}

export type AdminMetrics = {
  totalOrders: number
  totalRevenue: number
  activeStores: number
  activeCustomers: number
  avgRating: number
}

// Referências visuais reais do açaí tradicional: frutos, polpa pura e preparo artesanal.
export const traditionalAcaiImages = {
  spoon: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/acai3-NVkTw45YGZbGD2AE0s7p9XgbOHlM74.jpeg',
  baskets: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/acai2-z1LJbnLkdicCbdZwf6Oqwvgx2tGGg3.jpeg',
  machine: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/acai4-jfsmlPP4TL2UoUNYTUiDNq9FDSZuA1.jpeg',
  bowl: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/acai1-JOOqv9ZNnKtv6XzK15nUShZpeOjrJA.webp',
  ceramicBowl: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Captura%20de%20tela%20de%202026-09-08%2020-00-09-lXQumRrOjMWdFc9gRzMlTt3yO2GTAh.png',
  metalBowl: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Captura%20de%20tela%20de%202026-09-08%2019-58-23-NkvvlYDT6CSGuRfo7V8aiwVbXfZmzL.png',
  pouring: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Captura%20de%20tela%20de%202026-09-08%2019-59-48-YqRP786MSn8256c66ZtxC8sEDzA8Do.png',
} as const

// LOJAS MOCKADAS
export const mockStores: Store[] = [
  {
    id: 'store-001',
    name: 'Açaí do Seu João',
    owner: 'João Silva',
    address: 'Rua das Flores, 42 - Cametá',
    distance: 0.8,
    rating: 4.8,
    reviews: 156,
    isOpen: true,
    image: traditionalAcaiImages.spoon,
    status: 'open',
    queueSize: 3,
  },
  {
    id: 'store-002',
    name: 'Açaí Amazônia',
    owner: 'Maria Santos',
    address: 'Av. Principal, 128 - Cametá',
    distance: 1.2,
    rating: 4.6,
    reviews: 98,
    isOpen: true,
    image: traditionalAcaiImages.baskets,
    status: 'open',
    queueSize: 5,
  },
  {
    id: 'store-003',
    name: 'Puro Açaí',
    owner: 'Carlos Oliveira',
    address: 'Rua do Comércio, 75 - Cametá',
    distance: 1.5,
    rating: 4.9,
    reviews: 203,
    isOpen: true,
    image: traditionalAcaiImages.machine,
    status: 'open',
    queueSize: 2,
  },
  {
    id: 'store-004',
    name: 'Açaí Tradicional',
    owner: 'Francisca Costa',
    address: 'Praça Central, 15 - Cametá',
    distance: 2.1,
    rating: 4.5,
    reviews: 67,
    isOpen: false,
    image: traditionalAcaiImages.bowl,
    status: 'closed',
    queueSize: 0,
  },
]

// PRODUTOS MOCKADOS
export const mockProducts: Product[] = [
  {
    id: 'prod-001',
    name: 'Açaí Pequeno Tradicional',
    description: 'Açaí puro, batido na hora, sem açúcar e sem acompanhamentos.',
    price: 18.0,
    image: traditionalAcaiImages.ceramicBowl,
    storeId: 'store-001',
  },
  {
    id: 'prod-002',
    name: 'Açaí Médio Tradicional',
    description: 'Açaí puro em porção média, com a textura encorpada da receita local.',
    price: 24.0,
    image: traditionalAcaiImages.metalBowl,
    storeId: 'store-001',
  },
  {
    id: 'prod-003',
    name: 'Açaí Grande Tradicional',
    description: 'Porção grande de açaí puro para compartilhar, sem misturas ou derivados.',
    price: 32.0,
    image: traditionalAcaiImages.pouring,
    storeId: 'store-001',
  },
  {
    id: 'prod-004',
    name: 'Açaí Pequeno da Casa',
    description: 'Açaí puro, preparado na hora com frutos selecionados da região.',
    price: 22.0,
    image: traditionalAcaiImages.baskets,
    storeId: 'store-002',
  },
  {
    id: 'prod-005',
    name: 'Açaí Médio da Casa',
    description: 'Açaí puro em porção média, batido com frutos selecionados da região.',
    price: 28.0,
    image: traditionalAcaiImages.spoon,
    storeId: 'store-002',
  },
  {
    id: 'prod-006',
    name: 'Açaí Pequeno Tradicional',
    description: 'Receita tradicional de Cametá, sem açúcar, frutas ou produtos industrializados.',
    price: 16.0,
    image: traditionalAcaiImages.bowl,
    storeId: 'store-003',
  },
  {
    id: 'prod-007',
    name: 'Açaí Médio Tradicional',
    description: 'Receita tradicional de Cametá, servida pura e batida na hora.',
    price: 22.0,
    image: traditionalAcaiImages.machine,
    storeId: 'store-003',
  },
  {
    id: 'prod-008',
    name: 'Açaí Grande Tradicional',
    description: 'Tamanho família, com a consistência cremosa do açaí tradicional de Cametá.',
    price: 30.0,
    image: traditionalAcaiImages.baskets,
    storeId: 'store-003',
  },
]

// PEDIDOS MOCKADOS
export const mockOrders: Order[] = [
  {
    id: 'order-001',
    customerId: 'customer-001',
    storeId: 'store-001',
    items: [
      { productId: 'prod-002', quantity: 1, customizations: ['Açaí puro'] },
      { productId: 'prod-001', quantity: 1, customizations: [] },
    ],
    total: 42.0,
    status: 'delivered',
    createdAt: new Date(Date.now() - 3600000),
    estimatedTime: 15,
  },
  {
    id: 'order-002',
    customerId: 'customer-001',
    storeId: 'store-003',
    items: [{ productId: 'prod-007', quantity: 2, customizations: ['Açaí puro'] }],
    total: 44.0,
    status: 'ready',
    createdAt: new Date(Date.now() - 1200000),
    estimatedTime: 20,
  },
  {
    id: 'order-003',
    customerId: 'customer-001',
    storeId: 'store-002',
    items: [{ productId: 'prod-005', quantity: 1, customizations: [] }],
    total: 28.0,
    status: 'preparing',
    createdAt: new Date(Date.now() - 300000),
    estimatedTime: 12,
  },
]

// NOTIFICAÇÕES MOCKADAS
export const mockNotifications: Notification[] = [
  {
    id: 'notif-001',
    type: 'order_confirmed',
    message: 'Seu pedido em Puro Açaí foi confirmado!',
    timestamp: new Date(Date.now() - 300000),
    read: false,
  },
  {
    id: 'notif-002',
    type: 'order_ready',
    message: 'Seu pedido em Açaí do Seu João está pronto para retirada!',
    timestamp: new Date(Date.now() - 1200000),
    read: true,
  },
  {
    id: 'notif-003',
    type: 'promotion',
    message: 'Promoção especial: 15% de desconto na Açaí Amazônia',
    timestamp: new Date(Date.now() - 86400000),
    read: true,
  },
]

// MÉTRICAS ADMINISTRATIVAS
export const mockAdminMetrics: AdminMetrics = {
  totalOrders: 1847,
  totalRevenue: 45280.0,
  activeStores: 3,
  activeCustomers: 542,
  avgRating: 4.7,
}

// FUNÇÕES AUXILIARES

export function getStoreById(id: string): Store | undefined {
  return mockStores.find((store) => store.id === id)
}

export function getProductsByStoreId(storeId: string): Product[] {
  return mockProducts.filter((product) => product.storeId === storeId)
}

export function getOrdersByCustomerId(customerId: string): Order[] {
  return mockOrders.filter((order) => order.customerId === customerId)
}

export function getNotificationsByCustomerId(customerId: string): Notification[] {
  return mockNotifications
}

export function calculateOrderTotal(items: OrderItem[]): number {
  return items.reduce((total, item) => {
    const product = mockProducts.find((p) => p.id === item.productId)
    return total + (product?.price || 0) * item.quantity
  }, 0)
}

export function getOrderStatusLabel(status: Order['status']): string {
  const labels: Record<Order['status'], string> = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    preparing: 'Preparando',
    ready: 'Pronto',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
  }
  return labels[status]
}

export function getStoreStatusColor(status: Store['status']): string {
  const colors: Record<Store['status'], string> = {
    open: 'text-green-600',
    closed: 'text-red-600',
    busy: 'text-yellow-600',
  }
  return colors[status]
}
