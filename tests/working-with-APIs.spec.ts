import { test, expect, request } from '@playwright/test';
import tags from '../test-data/tags.json'


test('has title', async ({ page }) => {
  //mocking api
  await page.route('https://conduit-api.bondaracademy.com/api/tags', async route => {
    await route.fulfill({
      json: tags
    }
    )
  })
  //intercepting API response
  await page.route('*/**/api/articles*', async route => {
    const response = await route.fetch()
    const reponseJSON = await response.json()
    reponseJSON.articles[0].title = 'This is a mock TITLE'
    reponseJSON.articles[0].description = 'This is a mock DESCRIPTION'
    await route.fulfill({
      json: reponseJSON
    })
  })


  await page.goto('https://conduit.bondaracademy.com/');



  await expect(page.locator('.navbar-brand')).toHaveText(/conduit/);
  await expect(page.locator('.sidebar .tag-pill')).toContainText(tags.tags)
  await expect(page.locator('.article-preview h1').first()).toContainText('This is a mock TITLE')
  await expect(page.locator('.article-preview p').first()).toContainText('This is a mock DESCRIPTION')

});

test('Create and Delete Article', async ({ page, request }) => {
  const loginResponse = await request.post('https://conduit-api.bondaracademy.com/api/users/login', {
    data: {
      "user": {
        "email": "mirabeau@gmail.com",
        "password": "968431187"
      }
    }
  }
  )
  expect(loginResponse.status()).toEqual(200)

  const responseJSON = await loginResponse.json()
  const authenticationToken = responseJSON.user.token

  const newArticleReponse = await request.post('https://conduit-api.bondaracademy.com/api/articles', {
    data: {
      "article":
      {
        "title": "Test Title",
        "description": "Test Description",
        "body": "Test Body",
        "tagList": []
      }
    },
    headers: {
      Authorization: `Token ${authenticationToken}`
    }
  }
  )
  expect(newArticleReponse.status()).toEqual(201)

  await page.goto('https://conduit.bondaracademy.com/');
  await expect(page.locator('.article-preview h1').first()).toContainText('Test Title')
  await page.getByText('Test Title').click()

  await page.getByRole('button', { name: ' Delete Article ' }).first().click()
  await page.waitForResponse('https://conduit-api.bondaracademy.com/api/articles?limit=10&offset=0')
  await expect(page.locator('.article-preview h1').first()).not.toContainText('Test Title')

})

test('Create article', async ({ page, request }) => {
  await page.goto('https://conduit.bondaracademy.com/');

  await page.getByText(' New Article ').click()
  await page.getByPlaceholder('Article Title').fill('Test Title')
  await page.getByPlaceholder("What's this article about?").fill('Test Description')
  await page.getByPlaceholder('Write your article (in markdown)').fill('Test Body')

  
  await page.getByRole('button', { name: ' Publish Article ' }).click()

  const articleResponse = await page.waitForResponse('https://conduit-api.bondaracademy.com/api/articles/')
  const articleResponseJSON = await articleResponse.json()
  const slug = articleResponseJSON.article.slug


   const loginResponse = await request.post('https://conduit-api.bondaracademy.com/api/users/login', {
    data: {
      "user": {
        "email": "mirabeau@gmail.com",
        "password": "968431187"
      }
    }
  }
  )
  expect(loginResponse.status()).toEqual(200)

  const responseJSON = await loginResponse.json()
  const authenticationToken = responseJSON.user.token


  const deleteResponse = await request.delete(`https://conduit-api.bondaracademy.com/api/articles/${slug}`, {
    headers: {
      Authorization: `Token ${authenticationToken}`
    }
  })
  expect(deleteResponse.status()).toEqual(204)
})

