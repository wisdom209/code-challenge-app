/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_strs_to_tab.c                                   :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: wisdom <ononiwuwisdom@gmail.com>           +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/03/31 22:28:08 by wisdom            #+#    #+#             */
/*   Updated: 2026/04/01 05:22:07 by wisdom           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include <stdlib.h>
#include "ft_stock_str.h"

/**
 * ft_strlen - Get string length
 * @str: string
 *
 * Return: int
 */
int	ft_strlen(char *str)
{
	int	i;

	i = 0;
	while (str[i])
		i++;
	return (i);
}

/**
 * ft_strcpy - copy str to dest buffer
 * @str: source string
 * @dest: destination buffer
 *
 * Return: destination
 */
char	*ft_strcpy(char *dest, char *str)
{
	int		i;

	dest = malloc(sizeof(char) * ft_strlen(str));
	if (!dest)
		return (NULL);
	i = 0;
	while (str[i])
	{
		dest[i] = str[i];
		i++;
	}
	dest[i] = '\0';
	return (dest);
}

/**
 * ft_strs_to_tab - strings to struct array
 * @ac: array count
 * @av: array of strings
 *
 * Return: struct array
 */
struct s_stock_str	*ft_strs_to_tab(int ac, char **av)
{
	int				i;
	char			*buffer;
	t_stock_str		*stock_array;
	t_stock_str		t_stock_str;

	i = 0;
	buffer = NULL;
	if (ac <= 0)
		return (NULL);
	stock_array = malloc(sizeof(t_stock_str) * (ac + 1));
	if (!stock_array)
		return (NULL);
	while (i < ac)
	{
		t_stock_str.str = av[i];
		t_stock_str.copy = ft_strcpy(buffer, av[i]);
		t_stock_str.size = ft_strlen(av[i]);
		stock_array[i] = t_stock_str;
		i++;
	}
	t_stock_str.str = 0;
	stock_array[i] = t_stock_str;
	return (stock_array);
}
