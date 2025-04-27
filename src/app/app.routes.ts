import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: 'login', loadComponent: () => import('./pages/auth/auth.component').then(m => m.AuthComponent) },
    { path: 'register', loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent)},
    { path: 'forgot-password', loadComponent: () => import('./pages/auth/forgot/forgot.component').then(m => m.ForgotComponent)},
    { path: 'main', loadComponent: () => import('./pages/main/main.component').then(m => m.MainComponent)},
    {
        path: 'checkout',
        loadComponent: () => import('./pages/main/checkout/checkout.component').then(m => m.CheckoutComponent)
      },
      {
        path: 'profile',
        children: [
            {
                path: '',
                loadComponent: () => import('./pages/main/profile/profile.component').then(m => m.ProfileComponent),
                title: 'Mi Perfil'
            },
            {
                path: 'edit',
                loadComponent: () => import('./pages/main/edit-profile/edit-profile.component').then(m => m.EditProfileComponent),
                title: 'Editar Perfil'
            }
        ]
    },
    { 
        path: 'dashboard', 
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
        children: [
            { path: 'users', loadComponent: () => import('./pages/dashboard/usuarios/usuarios.component').then(m => m.UsuariosComponent) },
            { path: 'products', loadComponent: () => import('./pages/dashboard/productos/productos.component').then(m => m.ProductosComponent) },
            { path: 'category', loadComponent: () => import('./pages/dashboard/categorias/categorias.component').then(m => m.CategoriasComponent) },
            { path: 'sales', loadComponent: () => import('./pages/dashboard/ventas/ventas.component').then(m => m.VentasComponent) },
            { path: 'orders', loadComponent: () => import('./pages/dashboard/orders/orders.component').then(m => m.OrdersComponent) },
            { path: 'sumar', loadComponent: () => import('./pages/dashboard/sumar-estrellas/sumar-estrellas.component').then(m => m.SumarEstrellasComponent) },
            { path: '', redirectTo: 'users', pathMatch: 'full' }
        ]
    },
    { path: '', redirectTo: '/main', pathMatch: 'full' },
];