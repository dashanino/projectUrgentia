import {  inject } from '@angular/core';
import {CanActivateFn, Router} from '@angular/router'


export const authGuard: CanActivateFn = () => {
    const router = inject(Router); //propiedades para navegar, siempre llevar l login si no ha inicado sesión

    const token =  sessionStorage.getItem('access_token')//trae info del session storage, GET ITEM

    if (token){
        return true
    }

    router.navigate(['/login']) //iempre llevar l login si no ha inicado sesión
    return false;
}